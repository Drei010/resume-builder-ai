import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export default async function generateResumeOpenAI(
  systemPrompt: string,
  jobInfo: string
): Promise<any> {
  try {
    console.log("jobInfo:", jobInfo);
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Job Information:\n${jobInfo}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return openaiResponse.data.choices[0].message.content;
  } catch (openaiError: any) {
    console.error("OpenAI error, falling back to Gemini:", openaiError.message);
  }
}
