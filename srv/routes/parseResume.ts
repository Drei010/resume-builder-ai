import type { Request, Response } from "express";
import { isAxiosError } from "axios";
import { PARSE_RESUME_SYSTEM_PROMPT } from "../utils/constants.js";
import generateResumeOpenAI from "./openAI.js";
const MAX = 12000;
export async function parseResume(req: Request, res: Response) { if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" }); const text = req.body?.resumeText; if (typeof text !== "string" || !text.trim()) return res.status(400).json({ error: "resumeText is required" }); if (text.length > MAX) return res.status(413).json({ error: `resumeText must be under ${MAX.toLocaleString()} characters` }); try { const result = await generateResumeOpenAI(PARSE_RESUME_SYSTEM_PROMPT, text); const clean = result.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim(); return res.json(JSON.parse(clean)); } catch (error) { const details = isAxiosError(error) ? error.message : error instanceof Error ? error.message : "Invalid model response"; return res.status(422).json({ error: "Could not parse resume", details }); } }
export default parseResume;
