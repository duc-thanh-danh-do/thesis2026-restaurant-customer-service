import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export async function generateAiText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return "The AI assistant is not configured yet. Please ask restaurant staff for help.";
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    contents: prompt,
  });

  return response.text ?? "";
}
