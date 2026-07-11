import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_MAX_ATTEMPTS = 3;

function waitForRetry(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function generateAiText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

  return generateAiTextWithDependencies(prompt, {
    apiKey,
    model,
    generateContent: async (input) => {
      if (!client) throw new Error("AI client is unavailable");
      return client.models.generateContent(input);
    },
    wait: waitForRetry,
  });
}

export async function generateAiTextWithDependencies(
  prompt: string,
  dependencies: {
    apiKey?: string | null;
    model: string;
    maxAttempts?: number;
    generateContent: (input: {
      model: string;
      contents: string;
    }) => Promise<{ text?: string | null }>;
    wait: (milliseconds: number) => Promise<unknown>;
  },
) {
  if (!dependencies.apiKey?.trim()) {
    return "The AI assistant is not configured yet. Please ask restaurant staff for help.";
  }

  const maxAttempts = Math.max(1, dependencies.maxAttempts ?? GEMINI_MAX_ATTEMPTS);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await dependencies.generateContent({
        model: dependencies.model,
        contents: prompt,
      });

      return response.text ?? "";
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await dependencies.wait(500 * (attempt + 1));
      }
    }
  }

  throw lastError;
}
