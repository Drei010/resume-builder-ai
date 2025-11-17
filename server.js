import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// System prompt for resume generation
const systemPrompt = `You are an expert resume writer specializing in Harvard format ATS-friendly resumes. 
Your task is to transform unorganized job information into a professional, well-structured resume.

CRITICAL INSTRUCTIONS:
- NEVER ask for additional information, clarification, or details
- NEVER request follow-up information from the user
- NEVER say "Please provide more details"
- Work ONLY with the information provided by the user
- If information is vague or incomplete, use it as-is and structure it professionally
- Generate the resume NOW without any preamble or requests

Guidelines:
- Follow Harvard resume format strictly
- Use clear section headers: EDUCATION, EXPERIENCE, SKILLS, etc.
- Format experience with: Company Name, Job Title, Dates, bullet points of achievements
- Use action verbs and quantifiable achievements
- Optimize for ATS (Applicant Tracking Systems)
- Keep formatting simple and clean
- Use professional language
- Focus on impact and results

Return ONLY the resume in clean text format with proper spacing and organization. Do not include any explanatory text, questions, or requests.`;

// Resume generation endpoint
app.post("/api/generate-resume", async (req, res) => {
  try {
    const { jobInfo, aiProvider = "gemini" } = req.body;

    if (!jobInfo) {
      return res.status(400).json({ error: "jobInfo is required" });
    }

    let generatedResume;
    let lastError = null;

    // Try primary provider first
    if (aiProvider === "openai") {
      try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is not configured");
        }

        console.log("Generating resume using OpenAI...");

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        generatedResume = response.data.choices[0].message.content;
      } catch (error) {
        console.warn("OpenAI failed, falling back to Gemini...", error.message);
        lastError = error;
        // Fall through to try Gemini
      }
    } else {
      // Try Gemini first
      try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        console.log("Generating resume using Google Gemini...");

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nUser request: Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
            },
          }
        );

        generatedResume = response.data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.warn("Gemini failed, falling back to OpenAI...", error.message);
        lastError = error;
        // Fall through to try OpenAI
      }
    }

    // If primary provider failed, try backup (OpenAI)
    if (!generatedResume) {
      try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is not configured for backup");
        }

        console.log("Using OpenAI as backup provider...");

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        generatedResume = response.data.choices[0].message.content;
        console.log("Successfully generated resume using backup provider");
      } catch (backupError) {
        console.error("Backup provider also failed:", backupError.message);
        throw lastError || backupError;
      }
    }

    console.log("Resume generated successfully");

    res.json({ resume: generatedResume });
  } catch (error) {
    console.error("Error in generate-resume endpoint:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the resume",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Resume endpoint: POST http://localhost:${PORT}/api/generate-resume`
  );
});
