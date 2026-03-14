import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_TIMEOUT_MS = 10_000;
const OPENAI_MAX_CONTENT_LENGTH = 2_000_000;
const OPENAI_MODEL = "gpt-4o";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        schema: unknown;
        strict: boolean;
      };
    };

type OpenAIOptions = {
  temperature?: number;
  responseFormat?: OpenAIResponseFormat;
  model?: string;
};

const openaiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  timeout: OPENAI_TIMEOUT_MS,
  maxContentLength: OPENAI_MAX_CONTENT_LENGTH,
  maxBodyLength: OPENAI_MAX_CONTENT_LENGTH,
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

const isRetryable = (error: AxiosError) => {
  const status = error.response?.status;
  return status === 429 || (status !== undefined && status >= 500 && status < 600);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callOpenAIWithRetry = async (
  messages: OpenAIMessage[],
  options: OpenAIOptions = {},
  maxRetries = 3
): Promise<string> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await openaiClient.post("/chat/completions", {
        model: options.model ?? OPENAI_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.responseFormat
          ? { response_format: options.responseFormat }
          : {}),
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
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

  throw new Error("OpenAI request failed after retries");
};

export { callOpenAIWithRetry, openaiClient };
export type { OpenAIMessage, OpenAIOptions, OpenAIResponseFormat };
