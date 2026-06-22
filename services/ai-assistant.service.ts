import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_MAX_ATTEMPTS = 3;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function generateAiText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return "The AI assistant is not configured yet. Please ask restaurant staff for help.";
  }

  const client = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  let lastError: unknown;

  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text ?? "";
    } catch (error) {
      lastError = error;
      if (attempt < GEMINI_MAX_ATTEMPTS - 1) {
        await wait(500 * (attempt + 1));
      }
    }
  }

  throw lastError;
}
