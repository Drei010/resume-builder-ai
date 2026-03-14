import { API_ENDPOINTS } from "@/lib/api-config";
import type { ATSCandidateSummary } from "@shared/ats";

export type AiProvider = "openai" | "gemini";

export type JobDescription = {
  jobTitle: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredQualifications: string[];
};

const apiKey = import.meta.env.VITE_INTERNAL_API_KEY as string | undefined;

const withApiKey = (headers: HeadersInit = {}) => ({
  ...headers,
  ...(apiKey ? { "x-api-key": apiKey } : {}),
});

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
};

const ensureOk = async (response: Response, fallback: string) => {
  if (!response.ok) {
    const message = await parseErrorMessage(response, fallback);
    throw new Error(message);
  }
};

const generateResume = async (
  jobInfo: string,
  aiProvider: AiProvider
): Promise<ATSCandidateSummary> => {
  const response = await fetch(API_ENDPOINTS.generateResume, {
    method: "POST",
    headers: withApiKey({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobInfo, aiProvider }),
  });

  await ensureOk(response, "Failed to generate resume");
  return response.json();
};

const extractJobDescription = async (
  jobUrl: string
): Promise<JobDescription> => {
  const response = await fetch(API_ENDPOINTS.extractJob, {
    method: "POST",
    headers: withApiKey({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobUrl }),
  });

  await ensureOk(response, "Failed to extract job description");
  const data = await response.json();
  return data.jobDescription as JobDescription;
};

const optimizeResume = async (
  resumeFile: File,
  jobDescription: JobDescription
): Promise<ATSCandidateSummary> => {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobDescription", JSON.stringify(jobDescription));

  const response = await fetch(API_ENDPOINTS.optimizeResume, {
    method: "POST",
    headers: withApiKey(),
    body: formData,
  });

  await ensureOk(response, "Failed to optimize resume");
  return response.json();
};

const tailorResume = async (
  resumeFile: File,
  jobUrl: string,
  aiProvider: AiProvider
): Promise<ATSCandidateSummary> => {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobUrl", jobUrl);
  formData.append("aiProvider", aiProvider);

  const response = await fetch(API_ENDPOINTS.tailorResume, {
    method: "POST",
    headers: withApiKey(),
    body: formData,
  });

  await ensureOk(response, "Failed to tailor resume");
  return response.json();
};

export { extractJobDescription, generateResume, optimizeResume, tailorResume };
