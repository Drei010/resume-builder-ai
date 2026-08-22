import axios, { isAxiosError } from "axios";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_JOB_INFO_LENGTH = 20_000;
const REQUEST_TIMEOUT_MS = 45_000;

export default async function generateResumeOpenAI(
  systemPrompt: string,
  jobInfo: string,
  model = process.env.OPENAI_RESUME_MODEL || DEFAULT_MODEL
): Promise<string> {
  if (jobInfo.length > MAX_JOB_INFO_LENGTH) {
    throw new Error(
      `Job information is too long. Please keep it under ${MAX_JOB_INFO_LENGTH.toLocaleString()} characters.`
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  try {
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Candidate and job information:\n${jobInfo}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1800,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const content = openaiResponse.data.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }
    return content;
  } catch (error: unknown) {
    const message = isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error
      ? error.message
      : "Unknown error";
    console.error("OpenAI error:", message);
    throw new Error(`OpenAI request failed: ${message}`);
  }
}
