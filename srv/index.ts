import {
  SYSTEM_PROMPT,
  TAILOR_PROMPT,
  JOB_EXTRACTION_PROMPT,
  RESUME_OPTIMIZATION_PROMPT,
} from "./utils/constants.js";
import generateResumeOpenAI, { callOpenAI } from "./routes/openAI.js";
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

type JobDescriptionJson = {
  jobTitle: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredQualifications: string[];
};

type AtsWorkExperience = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
};

type AtsCandidateSummary = {
  candidate_id: string;
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: {
      city: string;
      country: string;
      remote_willing: boolean;
    };
    linkedin_url: string;
  };
  application: {
    job_id: string;
    job_title: string;
    department: string;
    applied_date: string;
    source: string;
    status: string;
  };
  resume_summary: {
    headline: string;
    years_of_experience: number;
    highest_education: {
      degree: string;
      field: string;
      institution: string;
      year: number;
    };
    skills: {
      technical: string[];
      soft: string[];
    };
    certifications: string[];
    work_experience: AtsWorkExperience[];
  };
  scoring: {
    overall_match_score: number;
    keyword_match_score: number;
    experience_match_score: number;
    education_match_score: number;
    matched_keywords: string[];
    missing_keywords: string[];
  };
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: string;
    tags: string[];
    gdpr_consent: boolean;
  };
};

type OptimizeRequest = Request & {
  file?: UploadedFile;
  body: {
    jobDescription?: string;
  };
};

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);
const MAX_DESCRIPTION_CHARS = 4000;
const MAX_JOB_TEXT_CHARS = 8000;
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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normalizeStringArray = (values: string[]) =>
  values.map((value) => value.trim()).filter(Boolean);

const parseJobDescriptionJson = (content: string): JobDescriptionJson | null => {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed?.jobTitle !== "string" ||
      typeof parsed?.company !== "string" ||
      !isStringArray(parsed?.responsibilities) ||
      !isStringArray(parsed?.requiredSkills) ||
      !isStringArray(parsed?.preferredQualifications)
    ) {
      return null;
    }

    return {
      jobTitle: parsed.jobTitle.trim(),
      company: parsed.company.trim(),
      responsibilities: normalizeStringArray(parsed.responsibilities),
      requiredSkills: normalizeStringArray(parsed.requiredSkills),
      preferredQualifications: normalizeStringArray(parsed.preferredQualifications),
    };
  } catch {
    return null;
  }
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T/;

const ensureString = (value: unknown) =>
  typeof value === "string" ? value : "";

const ensureBoolean = (value: unknown) => (typeof value === "boolean" ? value : false);

const ensureInt = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : 0;
};

const ensureScore = (value: unknown) => {
  const score = ensureInt(value);
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
};

const ensureStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

const ensureIsoDate = (value: unknown, fallback: string) => {
  if (typeof value === "string" && (isoDateRegex.test(value) || isoTimestampRegex.test(value))) {
    return value;
  }
  return fallback;
};

const ensureIsoTimestamp = (value: unknown, fallback: string) => {
  if (typeof value === "string" && isoTimestampRegex.test(value)) {
    return value;
  }
  return fallback;
};

const normalizeWorkExperience = (value: unknown): AtsWorkExperience[] => {
  if (!Array.isArray(value)) return [];

  return value.map((entry) => ({
    company: ensureString(entry?.company),
    title: ensureString(entry?.title),
    start_date: ensureIsoDate(entry?.start_date, ""),
    end_date: ensureIsoDate(entry?.end_date, ""),
    current: ensureBoolean(entry?.current),
    description: ensureString(entry?.description),
  }));
};

const normalizeAtsSummary = (input: any): AtsCandidateSummary => {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  return {
    candidate_id: ensureString(input?.candidate_id),
    personal_info: {
      full_name: ensureString(input?.personal_info?.full_name),
      email: ensureString(input?.personal_info?.email),
      phone: ensureString(input?.personal_info?.phone),
      location: {
        city: ensureString(input?.personal_info?.location?.city),
        country: ensureString(input?.personal_info?.location?.country),
        remote_willing: ensureBoolean(input?.personal_info?.location?.remote_willing),
      },
      linkedin_url: ensureString(input?.personal_info?.linkedin_url),
    },
    application: {
      job_id: ensureString(input?.application?.job_id),
      job_title: ensureString(input?.application?.job_title),
      department: ensureString(input?.application?.department),
      applied_date: ensureIsoDate(input?.application?.applied_date, today),
      source: ensureString(input?.application?.source),
      status: ensureString(input?.application?.status),
    },
    resume_summary: {
      headline: ensureString(input?.resume_summary?.headline),
      years_of_experience: ensureInt(input?.resume_summary?.years_of_experience),
      highest_education: {
        degree: ensureString(input?.resume_summary?.highest_education?.degree),
        field: ensureString(input?.resume_summary?.highest_education?.field),
        institution: ensureString(input?.resume_summary?.highest_education?.institution),
        year: ensureInt(input?.resume_summary?.highest_education?.year),
      },
      skills: {
        technical: ensureStringArray(input?.resume_summary?.skills?.technical),
        soft: ensureStringArray(input?.resume_summary?.skills?.soft),
      },
      certifications: ensureStringArray(input?.resume_summary?.certifications),
      work_experience: normalizeWorkExperience(input?.resume_summary?.work_experience),
    },
    scoring: {
      overall_match_score: ensureScore(input?.scoring?.overall_match_score),
      keyword_match_score: ensureScore(input?.scoring?.keyword_match_score),
      experience_match_score: ensureScore(input?.scoring?.experience_match_score),
      education_match_score: ensureScore(input?.scoring?.education_match_score),
      matched_keywords: ensureStringArray(input?.scoring?.matched_keywords),
      missing_keywords: ensureStringArray(input?.scoring?.missing_keywords),
    },
    metadata: {
      created_at: ensureIsoTimestamp(input?.metadata?.created_at, now),
      updated_at: ensureIsoTimestamp(input?.metadata?.updated_at, now),
      created_by: ensureString(input?.metadata?.created_by),
      tags: ensureStringArray(input?.metadata?.tags),
      gdpr_consent: ensureBoolean(input?.metadata?.gdpr_consent),
    },
  };
};

const parseAtsSummary = (content: string): AtsCandidateSummary | null => {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return normalizeAtsSummary(parsed);
  } catch {
    return null;
  }
};

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

const extractJobTextFromHtml = (html: string) =>
  safeSlice(stripHtml(html), MAX_JOB_TEXT_CHARS);

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

// Retry extraction to enforce clean JSON output from the model.
const extractJobDescriptionWithRetry = async (
  jobText: string,
  jobUrl: string
): Promise<JobDescriptionJson> => {
  let lastError = "Failed to extract job description";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const content = await callOpenAI(
        [
          {
            role: "system",
            content: JOB_EXTRACTION_PROMPT,
          },
          {
            role: "user",
            content: `LinkedIn URL: ${jobUrl}\n\nJob Posting Text:\n${jobText}`,
          },
        ],
        { temperature: 0.2, responseFormat: "json_object" }
      );

      const parsed = parseJobDescriptionJson(content);
      if (parsed) {
        return parsed;
      }
      lastError = "Extraction returned invalid JSON structure";
    } catch (error: any) {
      lastError = error.message || lastError;
    }
  }

  throw new Error(lastError);
};

const optimizeResumeWithJob = async (
  jobDescription: JobDescriptionJson,
  resumeText: string
): Promise<AtsCandidateSummary> => {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content: RESUME_OPTIMIZATION_PROMPT,
      },
      {
        role: "user",
        content: [
          "Job Description JSON:",
          JSON.stringify(jobDescription, null, 2),
          "",
          "Candidate Resume:",
          resumeText,
        ].join("\n"),
      },
    ],
    { temperature: 0.4, responseFormat: "json_object" }
  );

  const parsed = parseAtsSummary(content);
  if (!parsed) {
    throw new Error("Resume optimization returned invalid ATS summary JSON");
  }

  return parsed;
};

const generateAtsSummaryWithRetry = async (
  systemPrompt: string,
  userContent: string,
  attempts = 2
): Promise<AtsCandidateSummary> => {
  let lastError = "Failed to generate ATS summary";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const content = await callOpenAI(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        { temperature: 0.3, responseFormat: "json_object" }
      );

      const parsed = parseAtsSummary(content);
      if (parsed) {
        return parsed;
      }
      lastError = "OpenAI returned invalid ATS summary JSON";
    } catch (error: any) {
      lastError = error.message || lastError;
    }
  }

  throw new Error(lastError);
};

const generateAtsSummaryFromGemini = async (
  systemPrompt: string,
  userContent: string
): Promise<AtsCandidateSummary> => {
  const geminiResponse = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userContent}`,
            },
          ],
        },
      ],
    }
  );

  const content = geminiResponse.data.candidates[0].content.parts[0].text;
  const parsed = parseAtsSummary(content);
  if (!parsed) {
    throw new Error("Gemini returned invalid ATS summary JSON");
  }

  return parsed;
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
    const userContent = `Job Information:\n${jobInfo}`;
    let summary: AtsCandidateSummary;

    if (aiProvider === "gemini") {
      try {
        summary = await generateAtsSummaryFromGemini(
          SYSTEM_PROMPT,
          userContent
        );
      } catch (geminiError: any) {
        console.error(
          "Gemini error, falling back to OpenAI:",
          geminiError.message
        );
        summary = await generateAtsSummaryWithRetry(
          SYSTEM_PROMPT,
          userContent
        );
      }
    } else {
      summary = await generateAtsSummaryWithRetry(SYSTEM_PROMPT, userContent);
    }

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Error generating ATS summary:", error.message);
    return res.status(500).json({
      error: "Failed to generate ATS summary",
      details: error.message,
    });
  }
}

async function extractJobDescription(req: Request, res: Response) {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jobUrl = req.body?.jobUrl?.trim();
  if (!jobUrl) {
    return res.status(400).json({ error: "jobUrl is required" });
  }

  const jobId = extractLinkedInJobId(jobUrl);
  if (!jobId) {
    return res.status(400).json({
      error:
        "Invalid LinkedIn job URL. Please use a URL like https://www.linkedin.com/jobs/view/1234567890/",
    });
  }

  try {
    let jobHtml = "";
    try {
      jobHtml = await fetchLinkedInJobPosting(jobId);
    } catch {
      return res.status(400).json({
        error:
          "Unable to fetch the LinkedIn job post. Please confirm the URL is public and try again.",
      });
    }

    const jobText = extractJobTextFromHtml(jobHtml);
    if (!jobText) {
      return res.status(400).json({ error: "Job posting text is empty" });
    }

    const jobDescription = await extractJobDescriptionWithRetry(
      jobText,
      jobUrl
    );

    return res.status(200).json({ jobDescription });
  } catch (error: any) {
    console.error("Error extracting job description:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to extract job description",
    });
  }
}

async function optimizeResume(req: OptimizeRequest, res: Response) {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jobDescriptionRaw = req.body?.jobDescription;
  const file = req.file;

  if (!jobDescriptionRaw) {
    return res.status(400).json({ error: "jobDescription is required" });
  }

  if (!file) {
    return res.status(400).json({ error: "resume file is required" });
  }

  const jobDescription = parseJobDescriptionJson(jobDescriptionRaw);
  if (!jobDescription) {
    return res.status(400).json({
      error: "jobDescription must match the required JSON schema",
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

    const trimmedResume = safeSlice(resumeText, MAX_RESUME_CHARS);
    const optimizedResume = await optimizeResumeWithJob(
      jobDescription,
      trimmedResume
    );

    return res.status(200).json(optimizedResume);
  } catch (error: any) {
    console.error("Error optimizing resume:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to optimize resume",
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
export { generateResume, extractJobDescription, optimizeResume, tailorResume };
