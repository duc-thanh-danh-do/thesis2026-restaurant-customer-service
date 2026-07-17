import { GoogleGenAI } from "@google/genai";

export const KNOWLEDGE_EMBEDDING_MODEL = "gemini-embedding-2";
export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 768;

type EmbeddingContent = {
  title: string | null;
  content: string;
};

export function buildDocumentEmbeddingInput({ title, content }: EmbeddingContent) {
  return `title: ${title?.trim() || "none"} | text: ${content.trim()}`;
}

export function buildQueryEmbeddingInput(query: string) {
  return `task: question answering | query: ${query.trim()}`;
}

export async function generateKnowledgeEmbedding(input: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.embedContent({
    model: KNOWLEDGE_EMBEDDING_MODEL,
    contents: input,
    config: {
      outputDimensionality: KNOWLEDGE_EMBEDDING_DIMENSIONS,
    },
  });
  const values = response.embeddings?.[0]?.values;

  if (!values || values.length !== KNOWLEDGE_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${KNOWLEDGE_EMBEDDING_DIMENSIONS} embedding dimensions.`,
    );
  }

  return values;
}

export function formatPgVector(values: number[]) {
  return `[${values.map(formatPgVectorNumber).join(",")}]`;
}

function formatPgVectorNumber(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Embedding contains a non-finite value.");
  }

  return String(value);
}
