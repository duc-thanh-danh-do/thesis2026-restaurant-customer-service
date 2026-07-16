"use server";

import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ingestKnowledgeDocument } from "@/services/knowledge-document-ingestion.service";
import { revalidatePath } from "next/cache";

type KnowledgeDocumentRow = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  errorMessage: string | null;
  uploadedByName: string | null;
  chunkCount: bigint | number | string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type KnowledgeDocument = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  errorMessage: string | null;
  uploadedByName: string | null;
  chunkCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export async function uploadKnowledgeDocumentAction(formData: FormData) {
  try {
    const staffUser = await requireAdminUser();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return {
        success: false,
        error: "Please choose a .txt, .md, or .pdf file to upload.",
      };
    }

    const result = await ingestKnowledgeDocument({
      restaurantId: staffUser.restaurantId,
      uploadedByStaffId: staffUser.id,
      file,
    });

    revalidatePath("/knowledge-base");
    revalidatePath("/settings");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Failed to upload knowledge document:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload knowledge document.",
    };
  }
}

export async function getKnowledgeDocumentsAction(): Promise<KnowledgeDocument[]> {
  try {
    const staffUser = await requireAdminUser();
    const documents = await prisma.$queryRaw<KnowledgeDocumentRow[]>`
      SELECT
        documents."id",
        documents."original_filename" AS "originalFilename",
        documents."mime_type" AS "mimeType",
        documents."file_size" AS "fileSize",
        documents."status",
        documents."error_message" AS "errorMessage",
        staff_users."name" AS "uploadedByName",
        COUNT(chunks."id") AS "chunkCount",
        documents."created_at" AS "createdAt",
        documents."updated_at" AS "updatedAt"
      FROM "knowledge_documents" documents
      LEFT JOIN "staff_users" staff_users
        ON staff_users."id" = documents."uploaded_by_staff_id"
      LEFT JOIN "knowledge_document_chunks" chunks
        ON chunks."document_id" = documents."id"
      WHERE documents."restaurant_id" = ${staffUser.restaurantId}
      GROUP BY documents."id", staff_users."name"
      ORDER BY documents."updated_at" DESC NULLS LAST, documents."id" DESC
    `;

    return documents.map((document) => ({
      ...document,
      chunkCount: Number(document.chunkCount),
    }));
  } catch (error) {
    console.error("Failed to fetch knowledge documents:", error);
    return [];
  }
}
