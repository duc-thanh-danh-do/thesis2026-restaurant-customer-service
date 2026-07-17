import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { logger } from "@/lib/logger";
import {
  buildQueryEmbeddingInput,
  formatPgVector,
  generateKnowledgeEmbedding,
} from "@/services/knowledge-embedding.service";

const DEFAULT_RESULT_LIMIT = 4;

export type DocumentRetrievalMode = "vector" | "keyword" | "none";

export type RetrievedKnowledgeEntry = {
  id: number;
  title: string;
  category: string | null;
  content: string;
  score: number;
};

export type RetrievedDocumentChunk = {
  id: number;
  documentId: number;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
  retrievalMode: Exclude<DocumentRetrievalMode, "none">;
};

export type RetrievedKnowledge = {
  entries: RetrievedKnowledgeEntry[];
  documentChunks: RetrievedDocumentChunk[];
  documentRetrievalMode: DocumentRetrievalMode;
};

export type RetrievedKnowledgeLog = {
  manualEntries: Array<{
    id: number;
    title: string;
    category: string | null;
    content: string;
    score: number;
  }>;
  documentChunks: Array<{
    id: number;
    documentId: number;
    documentTitle: string;
    chunkIndex: number;
    content: string;
    score: number;
    retrievalMode: Exclude<DocumentRetrievalMode, "none">;
    scoreLabel: string;
  }>;
  documentRetrievalMode: DocumentRetrievalMode;
};

type KnowledgeEntryRow = RetrievedKnowledgeEntry;
type DocumentChunkRow = RetrievedDocumentChunk;

export async function retrieveRelevantKnowledge({
  restaurantId,
  query,
  limit = DEFAULT_RESULT_LIMIT,
}: {
  restaurantId: number;
  query: string;
  limit?: number;
}): Promise<RetrievedKnowledge> {
  const terms = extractSearchTerms(query);

  if (terms.length === 0) {
    return { entries: [], documentChunks: [], documentRetrievalMode: "none" };
  }

  try {
    const [entries, documentChunkResult] = await Promise.all([
      retrieveKnowledgeEntries({ restaurantId, query, terms, limit }),
      retrieveDocumentChunks({ restaurantId, query, terms, limit }),
    ]);

    return {
      entries,
      documentChunks: documentChunkResult.chunks,
      documentRetrievalMode: documentChunkResult.mode,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      logger.error("Failed to retrieve relevant knowledge", error);
    }

    return { entries: [], documentChunks: [], documentRetrievalMode: "none" };
  }
}

export function extractSearchTerms(query: string) {
  const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "and",
    "any",
    "are",
    "can",
    "could",
    "for",
    "from",
    "have",
    "how",
    "into",
    "please",
    "that",
    "the",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
    "you",
    "your",
  ]);

  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !stopWords.has(term)),
    ),
  ).slice(0, 8);
}

export function buildKeywordPattern(terms: string[]) {
  return `%${terms.map(escapeLikeTerm).join("%")}%`;
}

export function cosineDistanceToSimilarity(distance: number) {
  return 1 - distance;
}

export function formatRetrievedKnowledge(knowledge: RetrievedKnowledge) {
  const sections: string[] = [];

  if (knowledge.entries.length > 0) {
    sections.push(
      [
        "Manual knowledge base matches:",
        ...knowledge.entries.map((entry) =>
          [
            `- ${entry.title}`,
            `  Category: ${entry.category ?? "Not available"}`,
            `  Content: ${entry.content}`,
          ].join("\n"),
        ),
      ].join("\n"),
    );
  }

  if (knowledge.documentChunks.length > 0) {
    sections.push(
      [
        "Uploaded document matches:",
        ...knowledge.documentChunks.map((chunk) =>
          [
            `- ${chunk.documentTitle} (chunk ${chunk.chunkIndex + 1})`,
            `  Content: ${chunk.content}`,
          ].join("\n"),
        ),
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
}

export function buildRetrievedKnowledgeLog(
  knowledge: RetrievedKnowledge,
): RetrievedKnowledgeLog {
  return {
    manualEntries: knowledge.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      content: entry.content,
      score: entry.score,
    })),
    documentChunks: knowledge.documentChunks.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      score: chunk.score,
      retrievalMode: chunk.retrievalMode,
      scoreLabel: formatDocumentChunkScoreLabel(chunk),
    })),
    documentRetrievalMode: knowledge.documentRetrievalMode,
  };
}

export function formatDocumentChunkScoreLabel(chunk: RetrievedDocumentChunk) {
  return chunk.retrievalMode === "vector"
    ? `Vector similarity: ${formatRetrievalScore(chunk.score)}`
    : `Keyword score: ${formatRetrievalScore(chunk.score)}`;
}

export function formatRetrievalScore(score: number) {
  if (!Number.isFinite(score)) return "0.000";
  return score.toFixed(3);
}

async function retrieveKnowledgeEntries({
  restaurantId,
  query,
  terms,
  limit,
}: {
  restaurantId: number;
  query: string;
  terms: string[];
  limit: number;
}) {
  const { prisma } = await import("@/lib/prisma");
  const keywordPattern = buildKeywordPattern(terms);
  const rows = await prisma.$queryRaw<KnowledgeEntryRow[]>`
    SELECT
      "id",
      "title",
      "category",
      "content",
      ts_rank_cd(
        to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("category", '') || ' ' || "content"),
        websearch_to_tsquery('simple', ${query})
      ) AS "score"
    FROM "restaurant_knowledge_base"
    WHERE "restaurant_id" = ${restaurantId}
      AND "is_active" = true
      AND (
        to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("category", '') || ' ' || "content")
          @@ websearch_to_tsquery('simple', ${query})
        OR lower(coalesce("title", '') || ' ' || coalesce("category", '') || ' ' || "content")
          LIKE ${keywordPattern}
      )
    ORDER BY "score" DESC, "updated_at" DESC NULLS LAST, "id" ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

async function retrieveDocumentChunks({
  restaurantId,
  query,
  terms,
  limit,
}: {
  restaurantId: number;
  query: string;
  terms: string[];
  limit: number;
}): Promise<{ chunks: RetrievedDocumentChunk[]; mode: DocumentRetrievalMode }> {
  const vectorRows = await retrieveDocumentChunksByVector({
    restaurantId,
    query,
    limit,
  });

  if (vectorRows.length > 0) {
    return {
      chunks: vectorRows,
      mode: "vector" satisfies DocumentRetrievalMode,
    };
  }

  const keywordRows = await retrieveDocumentChunksByKeyword({
    restaurantId,
    query,
    terms,
    limit,
  });

  return {
    chunks: keywordRows,
    mode:
      keywordRows.length > 0
        ? ("keyword" satisfies DocumentRetrievalMode)
        : ("none" satisfies DocumentRetrievalMode),
  };
}

async function retrieveDocumentChunksByVector({
  restaurantId,
  query,
  limit,
}: {
  restaurantId: number;
  query: string;
  limit: number;
}) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const queryEmbedding = await generateKnowledgeEmbedding(
      buildQueryEmbeddingInput(query),
    );
    const queryVector = formatPgVector(queryEmbedding);
    const rows = await prisma.$queryRaw<DocumentChunkRow[]>`
      SELECT
        chunks."id",
        chunks."document_id" AS "documentId",
        documents."original_filename" AS "documentTitle",
        chunks."chunk_index" AS "chunkIndex",
        chunks."content",
        (1 - (chunks."embedding" <=> ${queryVector}::vector)) AS "score"
      FROM "knowledge_document_chunks" chunks
      INNER JOIN "knowledge_documents" documents
        ON documents."id" = chunks."document_id"
      WHERE documents."restaurant_id" = ${restaurantId}
        AND documents."status" = 'ready'
        AND documents."is_active" = true
        AND chunks."embedding" IS NOT NULL
      ORDER BY chunks."embedding" <=> ${queryVector}::vector, chunks."id" ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      ...row,
      score: Number(row.score),
      retrievalMode: "vector" as const,
    }));
  } catch (error) {
    if (!isExpectedVectorRetrievalGap(error)) {
      logger.warn("Vector knowledge retrieval failed; using keyword fallback.", error);
    }

    return [];
  }
}

async function retrieveDocumentChunksByKeyword({
  restaurantId,
  query,
  terms,
  limit,
}: {
  restaurantId: number;
  query: string;
  terms: string[];
  limit: number;
}) {
  const { prisma } = await import("@/lib/prisma");
  const keywordPattern = buildKeywordPattern(terms);
  const rows = await prisma.$queryRaw<DocumentChunkRow[]>`
    SELECT
      chunks."id",
      chunks."document_id" AS "documentId",
      documents."original_filename" AS "documentTitle",
      chunks."chunk_index" AS "chunkIndex",
      chunks."content",
      ts_rank_cd(
        to_tsvector('simple', documents."original_filename" || ' ' || chunks."content"),
        websearch_to_tsquery('simple', ${query})
      ) AS "score"
    FROM "knowledge_document_chunks" chunks
    INNER JOIN "knowledge_documents" documents
      ON documents."id" = chunks."document_id"
    WHERE documents."restaurant_id" = ${restaurantId}
      AND documents."status" = 'ready'
      AND documents."is_active" = true
      AND (
        to_tsvector('simple', documents."original_filename" || ' ' || chunks."content")
          @@ websearch_to_tsquery('simple', ${query})
        OR lower(documents."original_filename" || ' ' || chunks."content")
          LIKE ${keywordPattern}
      )
    ORDER BY "score" DESC, documents."updated_at" DESC NULLS LAST, chunks."id" ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    ...row,
    score: Number(row.score),
    retrievalMode: "keyword" as const,
  }));
}

function isExpectedVectorRetrievalGap(error: unknown) {
  return (
    !process.env.GEMINI_API_KEY?.trim() ||
    isDatabaseUnavailable(error) ||
    (error instanceof Error &&
      ((error.message.includes("embedding") &&
        error.message.includes("does not exist")) ||
        (error.message.includes("vector") &&
          error.message.includes("does not exist"))))
  );
}

function escapeLikeTerm(term: string) {
  return term.replace(/[\\%_]/g, (match) => `\\${match}`);
}
