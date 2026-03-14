import { AtsSchema, type ATSCandidateSummary, type ATSWorkExperience } from "../validators/atsSchema.js";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T/;

const ensureString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const ensureBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

const ensureInt = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : 0;
};

const ensureScore = (value: unknown): number => {
  const score = ensureInt(value);
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
};

const ensureStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const ensureIsoDate = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && (isoDateRegex.test(value) || isoTimestampRegex.test(value))) {
    return value;
  }
  return fallback;
};

const ensureIsoTimestamp = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && isoTimestampRegex.test(value)) {
    return value;
  }
  return fallback;
};

const normalizeWorkExperience = (value: unknown): ATSWorkExperience[] => {
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

const normalizeAtsSummary = (input: unknown): ATSCandidateSummary => {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  return {
    candidate_id: ensureString((input as any)?.candidate_id),
    personal_info: {
      full_name: ensureString((input as any)?.personal_info?.full_name),
      email: ensureString((input as any)?.personal_info?.email),
      phone: ensureString((input as any)?.personal_info?.phone),
      location: {
        city: ensureString((input as any)?.personal_info?.location?.city),
        country: ensureString((input as any)?.personal_info?.location?.country),
        remote_willing: ensureBoolean(
          (input as any)?.personal_info?.location?.remote_willing
        ),
      },
      linkedin_url: ensureString((input as any)?.personal_info?.linkedin_url),
    },
    application: {
      job_id: ensureString((input as any)?.application?.job_id),
      job_title: ensureString((input as any)?.application?.job_title),
      department: ensureString((input as any)?.application?.department),
      applied_date: ensureIsoDate(
        (input as any)?.application?.applied_date,
        today
      ),
      source: ensureString((input as any)?.application?.source),
      status: ensureString((input as any)?.application?.status),
    },
    resume_summary: {
      headline: ensureString((input as any)?.resume_summary?.headline),
      years_of_experience: ensureInt(
        (input as any)?.resume_summary?.years_of_experience
      ),
      highest_education: {
        degree: ensureString(
          (input as any)?.resume_summary?.highest_education?.degree
        ),
        field: ensureString(
          (input as any)?.resume_summary?.highest_education?.field
        ),
        institution: ensureString(
          (input as any)?.resume_summary?.highest_education?.institution
        ),
        year: ensureInt((input as any)?.resume_summary?.highest_education?.year),
      },
      skills: {
        technical: ensureStringArray(
          (input as any)?.resume_summary?.skills?.technical
        ),
        soft: ensureStringArray((input as any)?.resume_summary?.skills?.soft),
      },
      certifications: ensureStringArray(
        (input as any)?.resume_summary?.certifications
      ),
      work_experience: normalizeWorkExperience(
        (input as any)?.resume_summary?.work_experience
      ),
    },
    scoring: {
      overall_match_score: ensureScore(
        (input as any)?.scoring?.overall_match_score
      ),
      keyword_match_score: ensureScore(
        (input as any)?.scoring?.keyword_match_score
      ),
      experience_match_score: ensureScore(
        (input as any)?.scoring?.experience_match_score
      ),
      education_match_score: ensureScore(
        (input as any)?.scoring?.education_match_score
      ),
      matched_keywords: ensureStringArray((input as any)?.scoring?.matched_keywords),
      missing_keywords: ensureStringArray((input as any)?.scoring?.missing_keywords),
    },
    metadata: {
      created_at: ensureIsoTimestamp((input as any)?.metadata?.created_at, now),
      updated_at: ensureIsoTimestamp((input as any)?.metadata?.updated_at, now),
      created_by: ensureString((input as any)?.metadata?.created_by),
      tags: ensureStringArray((input as any)?.metadata?.tags),
      gdpr_consent: ensureBoolean((input as any)?.metadata?.gdpr_consent),
    },
  };
};

const parseAtsSummary = (content: string): ATSCandidateSummary | null => {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const normalized = normalizeAtsSummary(parsed);
    const result = AtsSchema.safeParse(normalized);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
};

export { normalizeAtsSummary, parseAtsSummary };
