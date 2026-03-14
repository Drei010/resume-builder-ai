import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIOptions = {
  temperature?: number;
  responseFormat?: "json_object";
};

const callOpenAI = async (
  messages: OpenAIMessage[],
  options: OpenAIOptions = {}
): Promise<string> => {
  const openaiResponse = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o",
      messages,
      temperature: options.temperature ?? 0.7,
      ...(options.responseFormat
        ? { response_format: { type: options.responseFormat } }
        : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const content = openaiResponse.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return content;
};

export default async function generateResumeOpenAI(
  systemPrompt: string,
  jobInfo: string
): Promise<any> {
  try {
    console.log("jobInfo:", jobInfo);
    return await callOpenAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Job Information:\n${jobInfo}`,
        },
      ],
      { temperature: 0.7 }
    );
  } catch (openaiError: any) {
    console.error("OpenAI error, falling back to Gemini:", openaiError.message);
  }
}

export { callOpenAI };
