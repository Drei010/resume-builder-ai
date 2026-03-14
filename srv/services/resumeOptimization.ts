import { fileTypeFromBuffer } from "file-type";
import { callGeminiWithRetry } from "../clients/gemini.js";
import { callOpenAIWithRetry, type OpenAIResponseFormat } from "../clients/openai.js";
import { parseAtsSummary } from "./atsNormalizer.js";
import {
  RESUME_OPTIMIZATION_PROMPT,
  SYSTEM_PROMPT,
  TAILOR_PROMPT,
} from "../utils/constants.js";
import { ATS_JSON_SCHEMA, type ATSCandidateSummary } from "../validators/atsSchema.js";
import type { JobDescriptionJson, JobDetails } from "./jobExtraction.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const MAX_RESUME_CHARS = 12_000;

const ATS_RESPONSE_FORMAT: OpenAIResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "ats_candidate_summary",
    schema: ATS_JSON_SCHEMA,
    strict: true,
  },
};

const isProbablyText = (buffer: Buffer) => {
  const sample = buffer.subarray(0, 1024);
  return !sample.includes(0);
};

const detectResumeMimeType = async (file: UploadedFile) => {
  const detected = await fileTypeFromBuffer(file.buffer);
  if (detected?.mime) {
    return detected.mime;
  }
  if (isProbablyText(file.buffer)) {
    return "text/plain";
  }
  return null;
};

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AiProvider = "openai" | "gemini";

const extractResumeText = async (file: UploadedFile) => {
  const detectedMime = await detectResumeMimeType(file);
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  }

  if (detectedMime === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (
    detectedMime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  return file.buffer.toString("utf-8");
};

const parseAtsJsonOrThrow = (content: string, errorMessage: string) => {
  const parsed = parseAtsSummary(content);
  if (!parsed) {
    throw new Error(errorMessage);
  }
  return parsed;
};

const generateAtsSummaryWithRetry = async (
  systemPrompt: string,
  userContent: string
): Promise<ATSCandidateSummary> => {
  const content = await callOpenAIWithRetry(
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
    { temperature: 0.3, responseFormat: ATS_RESPONSE_FORMAT }
  );

  return parseAtsJsonOrThrow(content, "OpenAI returned invalid ATS summary JSON");
};

const generateAtsSummaryFromGemini = async (
  systemPrompt: string,
  userContent: string
): Promise<ATSCandidateSummary> => {
  const content = await callGeminiWithRetry([
    {
      parts: [
        {
          text: `${systemPrompt}\n\n${userContent}`,
        },
      ],
    },
  ]);

  return parseAtsJsonOrThrow(content, "Gemini returned invalid ATS summary JSON");
};

const generateAtsSummaryWithProvider = async (
  systemPrompt: string,
  userContent: string,
  provider: AiProvider
) => {
  if (provider === "gemini") {
    try {
      return await generateAtsSummaryFromGemini(systemPrompt, userContent);
    } catch {
      return generateAtsSummaryWithRetry(systemPrompt, userContent);
    }
  }
  return generateAtsSummaryWithRetry(systemPrompt, userContent);
};

const generateResumeFromNotes = async (
  jobInfo: string,
  provider: AiProvider
): Promise<ATSCandidateSummary> => {
  const userContent = `Job Information:\n${jobInfo}`;
  return generateAtsSummaryWithProvider(SYSTEM_PROMPT, userContent, provider);
};

const optimizeResumeWithJob = async (
  jobDescription: JobDescriptionJson,
  resumeText: string
): Promise<ATSCandidateSummary> => {
  const content = await callOpenAIWithRetry(
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
    { temperature: 0.4, responseFormat: ATS_RESPONSE_FORMAT }
  );

  return parseAtsJsonOrThrow(
    content,
    "Resume optimization returned invalid ATS summary JSON"
  );
};

const tailorResumeFromJobDetails = async (
  jobUrl: string,
  jobDetails: JobDetails,
  resumeText: string,
  provider: AiProvider
): Promise<ATSCandidateSummary> => {
  const promptInput = [
    `Job Posting URL: ${jobUrl}`,
    `Title: ${jobDetails.title || "Unknown"}`,
    `Company: ${jobDetails.company || "Unknown"}`,
    `Location: ${jobDetails.location || "Unknown"}`,
    `Description:\n${jobDetails.description || ""}`,
    "",
    "Candidate Resume:",
    resumeText,
  ].join("\n");

  return generateAtsSummaryWithProvider(TAILOR_PROMPT, promptInput, provider);
};

const trimResumeText = (resumeText: string) =>
  resumeText.length > MAX_RESUME_CHARS
    ? resumeText.slice(0, MAX_RESUME_CHARS)
    : resumeText;

export {
  extractResumeText,
  generateResumeFromNotes,
  optimizeResumeWithJob,
  tailorResumeFromJobDetails,
  trimResumeText,
};
export type { AiProvider, UploadedFile };
