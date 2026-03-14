import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_TIMEOUT_MS = 10_000;
const GEMINI_MAX_CONTENT_LENGTH = 2_000_000;
const GEMINI_MODEL = "gemini-2.0-flash";

type GeminiPart = {
  text: string;
};

type GeminiContent = {
  parts: GeminiPart[];
};

type GeminiOptions = {
  responseMimeType?: string;
  model?: string;
};

const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  timeout: GEMINI_TIMEOUT_MS,
  maxContentLength: GEMINI_MAX_CONTENT_LENGTH,
  maxBodyLength: GEMINI_MAX_CONTENT_LENGTH,
});

const isRetryable = (error: AxiosError) => {
  const status = error.response?.status;
  return status === 429 || (status !== undefined && status >= 500 && status < 600);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (
  contents: GeminiContent[],
  options: GeminiOptions = {},
  maxRetries = 3
): Promise<string> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await geminiClient.post(
        `/models/${options.model ?? GEMINI_MODEL}:generateContent`,
        {
          contents,
          generationConfig: {
            responseMimeType: options.responseMimeType ?? "application/json",
          },
        },
        {
          params: {
            key: process.env.GEMINI_API_KEY,
          },
        }
      );

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Empty response from Gemini");
      }

      return content;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (!axios.isAxiosError(axiosError) || !isRetryable(axiosError) || attempt === maxRetries) {
        throw error;
      }
      const delay = 500 * 2 ** attempt;
      await sleep(delay);
      attempt += 1;
    }
  }

  throw new Error("Gemini request failed after retries");
};

export { callGeminiWithRetry, geminiClient };
export type { GeminiContent, GeminiOptions, GeminiPart };
