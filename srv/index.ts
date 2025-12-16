import { SYSTEM_PROMPT } from "./utils/constants.js";
import generateResumeOpenAI from "./routes/openAI.js";
import axios from "axios";
import dotenv from "dotenv";
import type { Request, Response } from "express";
dotenv.config();

// Main handler function - works with both Express and Vercel
async function generateResume(req: Request, res: Response) {
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
      } catch (geminiError: any) {
        console.error(
          "Gemini error, falling back to OpenAI:",
          geminiError.message
        );
        // Fall back to OpenAI
        resume = await generateResumeOpenAI(SYSTEM_PROMPT, jobInfo);
      }
    } else {
      // Try OpenAI first
      resume = await generateResumeOpenAI(SYSTEM_PROMPT, jobInfo);
    }

    return res.status(200).json({ resume });
  } catch (error: any) {
    console.error("Error generating resume OpenAI:", error.message);
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
