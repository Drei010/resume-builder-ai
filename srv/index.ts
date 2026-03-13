import { SYSTEM_PROMPT, TAILOR_PROMPT } from "./utils/constants.js";
import generateResumeOpenAI from "./routes/openAI.js";
import axios from "axios";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import path from "path";
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
dotenv.config();

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type TailorRequest = Request & {
  file?: UploadedFile;
  body: {
    jobUrl?: string;
    aiProvider?: string;
  };
};

type JobDetails = {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
};

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);
const MAX_DESCRIPTION_CHARS = 4000;
const MAX_RESUME_CHARS = 12000;

const applyCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripHtml = (value: string) => {
  const withoutTags = value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return decodeHtml(withoutTags).replace(/\s+/g, " ").trim();
};

const safeSlice = (value: string, limit: number) =>
  value.length > limit ? value.slice(0, limit) : value;

const extractLinkedInJobId = (url: string) => {
  const match = url.match(/linkedin\.com\/jobs\/view\/(\d+)/i);
  return match?.[1] || null;
};

const extractJobPostingJsonLd = (html: string) => {
  const matches = html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi,
  );

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        const jobPosting = parsed.find(
          (entry) => entry?.["@type"] === "JobPosting",
        );
        if (jobPosting) return jobPosting;
      }
      if (parsed?.["@type"] === "JobPosting") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const formatLocation = (jobLocation: any) => {
  if (!jobLocation) return undefined;
  const location = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
  const address = location?.address;
  if (!address) return undefined;
  const parts = [
    address.addressLocality,
    address.addressRegion,
    address.addressCountry,
  ].filter(Boolean);
  return parts.join(", ");
};

const extractJobDetails = (html: string): JobDetails => {
  const details: JobDetails = {};
  const jsonLd = extractJobPostingJsonLd(html);

  if (jsonLd) {
    details.title = jsonLd.title;
    details.company = jsonLd.hiringOrganization?.name;
    details.location = formatLocation(jsonLd.jobLocation);
    if (jsonLd.description) {
      details.description = stripHtml(jsonLd.description);
    }
  }

  if (!details.title) {
    const titleMatch = html.match(
      /top-card-layout__title[^>]*>([\s\S]*?)<\/h1>/i,
    );
    if (titleMatch?.[1]) {
      details.title = stripHtml(titleMatch[1]);
    }
  }

  if (!details.company) {
    const companyMatch = html.match(
      /top-card-layout__company[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (companyMatch?.[1]) {
      details.company = stripHtml(companyMatch[1]);
    }
  }

  if (!details.location) {
    const locationMatch = html.match(
      /top-card-layout__second-subline[^>]*>([\s\S]*?)<\/span>/i,
    );
    if (locationMatch?.[1]) {
      details.location = stripHtml(locationMatch[1]);
    }
  }

  if (!details.description) {
    const descriptionMatch = html.match(
      /show-more-less-html__markup[^>]*>([\s\S]*?)<\/span>/i,
    );
    if (descriptionMatch?.[1]) {
      details.description = stripHtml(descriptionMatch[1]);
    }
  }

  if (details.description) {
    details.description = safeSlice(details.description, MAX_DESCRIPTION_CHARS);
  }

  return details;
};

const fetchLinkedInJobPosting = async (jobId: string) => {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 10000,
  });
  return response.data as string;
};

const extractResumeText = async (file: UploadedFile) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  }

  if (extension === ".pdf") {
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  return file.buffer.toString("utf-8");
};

// Main handler function - works with both Express and Vercel
async function generateResume(req: Request, res: Response) {
  // Enable CORS
  applyCors(res);

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
          },
        );

        resume =
          geminiResponse.data.candidates[0].content.parts[0].text ||
          "Failed to generate resume";
      } catch (geminiError: any) {
        console.error(
          "Gemini error, falling back to OpenAI:",
          geminiError.message,
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

async function tailorResume(req: TailorRequest, res: Response) {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jobUrl = req.body?.jobUrl?.trim();
  const aiProvider = req.body?.aiProvider || "openai";
  const file = req.file;

  if (!jobUrl) {
    return res.status(400).json({ error: "jobUrl is required" });
  }

  if (!file) {
    return res.status(400).json({ error: "resume file is required" });
  }

  const jobId = extractLinkedInJobId(jobUrl);
  if (!jobId) {
    return res.status(400).json({
      error:
        "Invalid LinkedIn job URL. Please use a URL like https://www.linkedin.com/jobs/view/1234567890/",
    });
  }

  try {
    let resumeText = "";
    try {
      resumeText = await extractResumeText(file);
    } catch (extractError: any) {
      return res.status(400).json({
        error: extractError.message || "Failed to read resume file",
      });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Resume text could not be read" });
    }

    let jobHtml = "";
    try {
      jobHtml = await fetchLinkedInJobPosting(jobId);
    } catch {
      return res.status(400).json({
        error:
          "Unable to fetch the LinkedIn job post. Please confirm the URL is public and try again.",
      });
    }
    const jobDetails = extractJobDetails(jobHtml);

    if (!jobDetails.description) {
      return res
        .status(400)
        .json({ error: "Failed to extract job description" });
    }

    const trimmedResume = safeSlice(resumeText, MAX_RESUME_CHARS);
    const promptInput = [
      `Job Posting URL: ${jobUrl}`,
      `Title: ${jobDetails.title || "Unknown"}`,
      `Company: ${jobDetails.company || "Unknown"}`,
      `Location: ${jobDetails.location || "Unknown"}`,
      `Description:\n${jobDetails.description}`,
      "",
      "Candidate Resume:",
      trimmedResume,
    ].join("\n");

    let resume = "";

    if (aiProvider === "gemini") {
      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${TAILOR_PROMPT}\n\n${promptInput}`,
                  },
                ],
              },
            ],
          },
        );

        resume =
          geminiResponse.data.candidates[0].content.parts[0].text ||
          "Failed to generate resume";
      } catch (geminiError: any) {
        console.error(
          "Gemini error, falling back to OpenAI:",
          geminiError.message,
        );
        resume = await generateResumeOpenAI(TAILOR_PROMPT, promptInput);
      }
    } else {
      resume = await generateResumeOpenAI(TAILOR_PROMPT, promptInput);
    }

    if (!resume) {
      throw new Error("Resume generation failed");
    }

    return res.status(200).json({
      resume,
      jobDetails,
    });
  } catch (error: any) {
    console.error("Error tailoring resume:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to tailor resume",
    });
  }
}

// Export for Vercel (serverless function - default export)
export default generateResume;

// Export for Express (local development)
export { generateResume, tailorResume };
