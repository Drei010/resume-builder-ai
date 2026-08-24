import { isAxiosError } from "axios";
import type { Request, Response } from "express";
import { TAILOR_SYSTEM_PROMPT } from "../utils/constants.js";
import generateResumeOpenAI from "./openAI.js";

const MAX_JOB_DESCRIPTION_LENGTH = 12_000;
const MAX_ENTRIES = 200;
const MAX_TASK_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 60_000;
const MAX_TOTAL_ENTRY_CHARS = 30_000;

type TailorEntry = {
  id: string;
  companyId: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  dateRange?: string;
  startMonth: string;
  endMonth: string | null;
  task: string;
};

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) return error.response?.data?.error?.message || error.message;
  return error instanceof Error ? error.message : "Unknown error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateEntries(value: unknown): TailorEntry[] | string {
  if (!Array.isArray(value) || value.length === 0) return "At least one work entry is required.";
  if (value.length > MAX_ENTRIES) return `A maximum of ${MAX_ENTRIES} work entries is supported.`;

  const entries: TailorEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) return "Each work entry must be an object.";
    const textFields = ["id", "companyId", "companyName", "jobTitle", "startMonth", "task"];
    if (textFields.some((field) => typeof item[field] !== "string" || !String(item[field]).trim())) {
      return "Each work entry needs an id, company, job title, start month, and task.";
    }
    if (String(item.task).length > MAX_TASK_LENGTH) {
      return `Each work task must be under ${MAX_TASK_LENGTH.toLocaleString()} characters.`;
    }
    if (item.endMonth !== null && typeof item.endMonth !== "string") return "Entry endMonth must be a month string or null.";
    entries.push({
      id: String(item.id),
      companyId: String(item.companyId),
      companyName: String(item.companyName),
      jobTitle: String(item.jobTitle),
      location: typeof item.location === "string" ? item.location : undefined,
      dateRange: typeof item.dateRange === "string" ? item.dateRange : undefined,
      startMonth: String(item.startMonth),
      endMonth: item.endMonth === null ? null : String(item.endMonth),
      task: String(item.task).trim(),
    });
  }
  return entries;
}

export async function tailorResume(req: Request, res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body ?? {};
  const jobDescription = body.jobDescription;
  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return res.status(400).json({ error: "jobDescription is required" });
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return res.status(413).json({ error: `jobDescription must be under ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters` });
  }

  const entries = validateEntries(body.entries);
  if (typeof entries === "string") return res.status(400).json({ error: entries });

  const compactEntries = entries.reduce<TailorEntry[]>((result, entry) => {
    if (result.reduce((size, item) => size + item.task.length, 0) + entry.task.length <= MAX_TOTAL_ENTRY_CHARS) {
      result.push({ ...entry, task: entry.task.slice(0, MAX_TASK_LENGTH) });
    }
    return result;
  }, []);
  if (!compactEntries.length) return res.status(413).json({ error: "The work entries are too large or incomplete. Shorten the task descriptions and try again." });
  const context = `Target job description:\n${jobDescription.trim().slice(0, 8000)}\n\nWork database entries (use only these facts):\n${JSON.stringify(compactEntries)}`;
  if (context.length > MAX_CONTEXT_LENGTH) {
    return res.status(413).json({ error: "The job description and work entries are too large. Shorten them and try again." });
  }

  try {
    const resume = await generateResumeOpenAI(TAILOR_SYSTEM_PROMPT, context);
    return res.status(200).json({ resume, provider: "openai" });
  } catch (error) {
    console.error("Tailored resume generation failed:", errorMessage(error));
    return res.status(500).json({ error: "Failed to tailor resume", details: errorMessage(error) });
  }
}

export default tailorResume;
