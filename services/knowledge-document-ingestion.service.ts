import { prisma } from "@/lib/prisma";
import {
  getKnowledgeDocumentFileExtension,
  validateKnowledgeDocumentFile,
} from "@/services/knowledge-document-validation";

export { validateKnowledgeDocumentFile };

const DEFAULT_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 800;

export type KnowledgeDocumentStatus = "processing" | "ready" | "failed";

export type KnowledgeDocumentIngestionResult = {
  documentId: number;
  chunkCount: number;
  status: Extract<KnowledgeDocumentStatus, "ready">;
};

type KnowledgeDocumentRow = {
  id: number;
};

type PdfParseModule = {
  default?: (buffer: Buffer) => Promise<{ text?: string }>;
  PDFParse?: new (options: {
    data: Buffer;
  }) => {
    getText: () => Promise<{ text?: string }>;
    destroy?: () => Promise<void> | void;
  };
};

export async function ingestKnowledgeDocument({
  restaurantId,
  uploadedByStaffId,
  file,
}: {
  restaurantId: number;
  uploadedByStaffId: number | null;
  file: File;
}): Promise<KnowledgeDocumentIngestionResult> {
  let documentId: number | null = null;

  try {
    validateKnowledgeDocumentFile(file);

    const [document] = await prisma.$queryRaw<KnowledgeDocumentRow[]>`
      INSERT INTO "knowledge_documents" (
        "restaurant_id",
        "uploaded_by_staff_id",
        "original_filename",
        "mime_type",
        "file_size",
        "status",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${restaurantId},
        ${uploadedByStaffId},
        ${file.name},
        ${file.type || "application/octet-stream"},
        ${file.size},
        'processing',
        NOW(),
        NOW()
      )
      RETURNING "id"
    `;

    documentId = document.id;
    const text = normalizeKnowledgeDocumentText(
      await extractKnowledgeDocumentText(file),
    );
    const chunks = chunkKnowledgeDocumentText(text);

    if (chunks.length === 0) {
      throw new Error("Document does not contain readable text.");
    }

    await replaceDocumentChunks(documentId, chunks);
    await markDocumentStatus(documentId, "ready");

    return {
      documentId,
      chunkCount: chunks.length,
      status: "ready",
    };
  } catch (error) {
    if (documentId) {
      await markDocumentStatus(
        documentId,
        "failed",
        error instanceof Error ? error.message : "Document ingestion failed.",
      );
    }

    throw error;
  }
}

async function extractKnowledgeDocumentText(file: File) {
  const extension = getKnowledgeDocumentFileExtension(file.name);

  if (extension !== ".pdf") {
    return file.text();
  }

  return extractPdfText(file);
}

async function extractPdfText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfParsePackage = "pdf-parse";
  const pdfParseModule = (await import(pdfParsePackage)) as PdfParseModule;

  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy?.();
    }
  }

  if (pdfParseModule.default) {
    const result = await pdfParseModule.default(buffer);
    return result.text ?? "";
  }

  throw new Error("PDF parser is not available.");
}

export function normalizeKnowledgeDocumentText(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/^-- \d+ of \d+ --$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkKnowledgeDocumentText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
) {
  const normalizedText = normalizeKnowledgeDocumentText(text);
  if (!normalizedText) return [];

  const chunks: string[] = [];
  let remaining = normalizedText;

  while (remaining.length > chunkSize) {
    const splitAt = findChunkSplitIndex(remaining, chunkSize);
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

async function replaceDocumentChunks(documentId: number, chunks: string[]) {
  await prisma.$executeRaw`
    DELETE FROM "knowledge_document_chunks"
    WHERE "document_id" = ${documentId}
  `;

  for (const [index, chunk] of chunks.entries()) {
    await prisma.$executeRaw`
      INSERT INTO "knowledge_document_chunks" (
        "document_id",
        "chunk_index",
        "content",
        "created_at"
      )
      VALUES (
        ${documentId},
        ${index},
        ${chunk},
        NOW()
      )
    `;
  }
}

async function markDocumentStatus(
  documentId: number,
  status: KnowledgeDocumentStatus,
  errorMessage: string | null = null,
) {
  await prisma.$executeRaw`
    UPDATE "knowledge_documents"
    SET
      "status" = ${status},
      "error_message" = ${errorMessage},
      "updated_at" = NOW()
    WHERE "id" = ${documentId}
  `;
}

function findChunkSplitIndex(text: string, chunkSize: number) {
  const paragraphBreak = text.lastIndexOf("\n\n", chunkSize);
  if (paragraphBreak >= MIN_CHUNK_SIZE) return paragraphBreak;

  const lineBreak = text.lastIndexOf("\n", chunkSize);
  if (lineBreak >= MIN_CHUNK_SIZE) return lineBreak;

  const sentenceBreak = Math.max(
    text.lastIndexOf(". ", chunkSize),
    text.lastIndexOf("? ", chunkSize),
    text.lastIndexOf("! ", chunkSize),
  );
  if (sentenceBreak >= MIN_CHUNK_SIZE) return sentenceBreak + 1;

  const wordBreak = text.lastIndexOf(" ", chunkSize);
  if (wordBreak >= MIN_CHUNK_SIZE) return wordBreak;

  return chunkSize;
}
