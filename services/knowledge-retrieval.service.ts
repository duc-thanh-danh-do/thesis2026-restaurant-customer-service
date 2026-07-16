import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { logger } from "@/lib/logger";

const DEFAULT_RESULT_LIMIT = 4;

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
};

export type RetrievedKnowledge = {
  entries: RetrievedKnowledgeEntry[];
  documentChunks: RetrievedDocumentChunk[];
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
    return { entries: [], documentChunks: [] };
  }

  try {
    const [entries, documentChunks] = await Promise.all([
      retrieveKnowledgeEntries({ restaurantId, query, terms, limit }),
      retrieveDocumentChunks({ restaurantId, query, terms, limit }),
    ]);

    return { entries, documentChunks };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      logger.error("Failed to retrieve relevant knowledge", error);
    }

    return { entries: [], documentChunks: [] };
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

  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

function escapeLikeTerm(term: string) {
  return term.replace(/[\\%_]/g, (match) => `\\${match}`);
}
