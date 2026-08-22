import { SYSTEM_PROMPT } from "./utils/constants.js";
import generateResumeOpenAI from "./routes/openAI.js";
import axios, { isAxiosError } from "axios";
import dotenv from "dotenv";
import type { Request, Response } from "express";
dotenv.config();

async function generateResumeGemini(jobInfo: string): Promise<string> {
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

  const content = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Gemini returned an empty response");
  }
  return content;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message;
  }
  return error instanceof Error ? error.message : "Unknown error";
}

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

  const { jobInfo } = req.body;

  if (!jobInfo || typeof jobInfo !== "string" || !jobInfo.trim()) {
    return res.status(400).json({ error: "jobInfo is required" });
  }

  try {
    const resume = await generateResumeOpenAI(SYSTEM_PROMPT, jobInfo);
    return res.status(200).json({ resume, provider: "openai" });
  } catch (error: unknown) {
    console.error("OpenAI resume generation failed:", getErrorMessage(error));
    return res.status(500).json({
      error: "Failed to generate resume",
      details: getErrorMessage(error),
    });
  }
}

// Export for Vercel (serverless function - default export)
export default generateResume;

// Export for Express (local development)
export { generateResume };
