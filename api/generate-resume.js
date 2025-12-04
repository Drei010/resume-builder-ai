import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// System prompt for resume generation
const SYSTEM_PROMPT = `You are an expert resume writer specializing in creating ATS (Applicant Tracking System) optimized resumes in Harvard format.

IMPORTANT RULES:
1. NEVER ask for more details or clarification
2. NEVER ask follow-up questions
3. Generate a complete, polished resume based ONLY on the information provided
4. Use Harvard resume format (reverse chronological, clean, professional)
5. Optimize for ATS systems (use standard formatting, clear sections)
6. Keep it concise but impactful (max 1 page if possible)
7. Use professional language and action verbs
8. Include: Contact Info, Professional Summary, Experience, Education, Skills, Certifications (if any)

Generate the resume now based on the provided job information.`;

// Main handler function - works with both Express and Vercel
async function generateResume(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobInfo, aiProvider = "openai" } = req.body;

  console.log(jobInfo);
  console.log(aiProvider);
  if (!jobInfo) {
    return res.status(400).json({ error: "jobInfo is required" });
  }

  try {
    let resume = "";

    if (aiProvider === "gemini") {
      // Try Gemini first
      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nJob Information:\n${jobInfo}`,
                  },
                ],
              },
            ],
          }
        );

        resume =
          geminiResponse.data.candidates[0].content.parts[0].text ||
          "Failed to generate resume";
      } catch (geminiError) {
        console.error(
          "Gemini error, falling back to OpenAI:",
          geminiError.message
        );
        // Fall back to OpenAI
        const openaiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `Job Information:\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );

        resume = openaiResponse.data.choices[0].message.content;
      }
    } else {
      // Try OpenAI first
      try {
        const openaiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `Job Information:\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );

        resume = openaiResponse.data.choices[0].message.content;
      } catch (openaiError) {
        console.error(
          "OpenAI error, falling back to Gemini:",
          openaiError.message
        );
        // Fall back to Gemini
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nJob Information:\n${jobInfo}`,
                  },
                ],
              },
            ],
          }
        );

        resume =
          geminiResponse.data.candidates[0].content.parts[0].text ||
          "Failed to generate resume";
      }
    }

    return res.status(200).json({ resume });
  } catch (error) {
    console.error("Error generating resume:", error.message);
    return res.status(500).json({
      error: "Failed to generate resume",
      details: error.message,
    });
  }
}

// Export for Vercel (serverless function - default export)
export default generateResume;

// Export for Express (local development)
export { generateResume };
