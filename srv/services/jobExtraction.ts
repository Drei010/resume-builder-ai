import axios from "axios";
import { callOpenAIWithRetry } from "../clients/openai.js";
import { JOB_EXTRACTION_PROMPT } from "../utils/constants.js";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_CONTENT_LENGTH = 2_000_000;
const MAX_DESCRIPTION_CHARS = 4000;
const MAX_JOB_TEXT_CHARS = 8000;

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

const extractLinkedInJobId = (url: string) => {
  const match = url.match(/linkedin\.com\/jobs\/view\/(\d+)/i);
  return match?.[1] || null;
};

const extractJobPostingJsonLd = (html: string) => {
  const matches = html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi
  );

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        const jobPosting = parsed.find((entry) => entry?.["@type"] === "JobPosting");
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
    const titleMatch = html.match(/top-card-layout__title[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch?.[1]) {
      details.title = stripHtml(titleMatch[1]);
    }
  }

  if (!details.company) {
    const companyMatch = html.match(
      /top-card-layout__company[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
    );
    if (companyMatch?.[1]) {
      details.company = stripHtml(companyMatch[1]);
    }
  }

  if (!details.location) {
    const locationMatch = html.match(
      /top-card-layout__second-subline[^>]*>([\s\S]*?)<\/span>/i
    );
    if (locationMatch?.[1]) {
      details.location = stripHtml(locationMatch[1]);
    }
  }

  if (!details.description) {
    const descriptionMatch = html.match(
      /show-more-less-html__markup[^>]*>([\s\S]*?)<\/span>/i
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
    timeout: REQUEST_TIMEOUT_MS,
    maxContentLength: MAX_CONTENT_LENGTH,
    maxBodyLength: MAX_CONTENT_LENGTH,
  });
  return response.data as string;
};

const extractJobDescriptionWithRetry = async (
  jobText: string,
  jobUrl: string
): Promise<JobDescriptionJson> => {
  let lastError = "Failed to extract job description";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const content = await callOpenAIWithRetry(
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
        { temperature: 0.2, responseFormat: { type: "json_object" } }
      );

      const parsed = parseJobDescriptionJson(content);
      if (parsed) {
        return parsed;
      }
      lastError = "Extraction returned invalid JSON structure";
    } catch (error: any) {
      lastError = error?.message || lastError;
    }
  }

  throw new Error(lastError);
};

export {
  extractJobDescriptionWithRetry,
  extractJobDetails,
  extractJobTextFromHtml,
  extractLinkedInJobId,
  fetchLinkedInJobPosting,
  parseJobDescriptionJson,
};
export type { JobDescriptionJson, JobDetails };
