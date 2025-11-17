import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {} from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobInfo, aiProvider = "gemini" } = await req.json();

    const systemPrompt = `You are an expert resume writer specializing in Harvard format ATS-friendly resumes. 
Your task is to transform unorganized job information into a professional, well-structured resume.

CRITICAL INSTRUCTIONS:
- NEVER ask for additional information, clarification, or details
- NEVER request follow-up information from the user
- NEVER say "Please provide more details"
- Work ONLY with the information provided by the user
- If information is vague or incomplete, use it as-is and structure it professionally
- Generate the resume NOW without any preamble or requests

Guidelines:
- Follow Harvard resume format strictly
- Use clear section headers: EDUCATION, EXPERIENCE, SKILLS, etc.
- Format experience with: Company Name, Job Title, Dates, bullet points of achievements
- Use action verbs and quantifiable achievements
- Optimize for ATS (Applicant Tracking Systems)
- Keep formatting simple and clean
- Use professional language
- Focus on impact and results
- Ensure that all the generated content fits in 1 page

Return ONLY the resume in clean text format with proper spacing and organization. Do not include any explanatory text, questions, or requests.`;

    let response;
    let generatedResume;
    let lastError: Error | null = null;

    // Try primary provider first
    if (aiProvider === "openai") {
      try {
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is not configured");
        }

        console.log("Generating resume using OpenAI...");

        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API error:", response.status, errorText);
          lastError = new Error(`OpenAI API error: ${response.status}`);
          throw lastError;
        }

        const data = await response.json();
        generatedResume = data.choices[0].message.content;
      } catch (error) {
        console.warn("OpenAI failed, falling back to Gemini...", error);
        lastError = error as Error;
        // Fall through to try Gemini
      }
    } else {
      // Try Gemini first
      try {
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        console.log("Generating resume using Google Gemini...");

        response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            GEMINI_API_KEY,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}\n\nUser request: Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API error:", response.status, errorText);
          lastError = new Error(`Gemini API error: ${response.status}`);
          throw lastError;
        }

        const data = await response.json();
        generatedResume = data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.warn("Gemini failed, falling back to OpenAI...", error);
        lastError = error as Error;
        // Fall through to try OpenAI
      }
    }

    // If primary provider failed, try backup (OpenAI)
    if (!generatedResume) {
      try {
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is not configured for backup");
        }

        console.log("Using OpenAI as backup provider...");

        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Transform this job information into a professional Harvard format resume:\n\n${jobInfo}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backup OpenAI API error:", response.status, errorText);
          throw new Error(`Backup OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        generatedResume = data.choices[0].message.content;
        console.log("Successfully generated resume using backup provider");
      } catch (backupError) {
        console.error("Backup provider also failed:", backupError);
        throw lastError || backupError;
      }
    }

    console.log("Resume generated successfully");

    return new Response(JSON.stringify({ resume: generatedResume }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-resume function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
