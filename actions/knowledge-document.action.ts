"use server";

import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ingestKnowledgeDocument } from "@/services/knowledge-document-ingestion.service";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { canPublishKnowledgeDocument } from "@/lib/domain/admin-content";

type KnowledgeDocumentRow = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  publicationStatus: string;
  isActive: boolean;
  errorMessage: string | null;
  validationResults: Prisma.JsonValue | null;
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
  publicationStatus: string;
  isActive: boolean;
  errorMessage: string | null;
  validationResults: Prisma.JsonValue | null;
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
    revalidatePath("/admin/knowledge");
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
        documents."publication_status" AS "publicationStatus",
        documents."is_active" AS "isActive",
        documents."error_message" AS "errorMessage",
        documents."validation_results" AS "validationResults",
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

export async function updateKnowledgeDocumentActiveAction(
  documentId: number,
  isActive: boolean,
) {
  try {
    const staffUser = await requireAdminUser();
    const document = await prisma.knowledgeDocument.findFirst({
      where: { id: documentId, restaurantId: staffUser.restaurantId },
    });
    if (!document) return { success: false, error: "Document was not found." };
    if (document.publicationStatus !== "PUBLISHED") {
      return { success: false, error: "Only published documents can be activated." };
    }
    const result = await prisma.$executeRaw`
      UPDATE "knowledge_documents"
      SET
        "is_active" = ${isActive},
        "updated_at" = NOW()
      WHERE "id" = ${documentId}
        AND "restaurant_id" = ${staffUser.restaurantId}
    `;

    if (Number(result) === 0) {
      return {
        success: false,
        error: "Document was not found.",
      };
    }

    await writeKnowledgeAudit({
      restaurantId: staffUser.restaurantId,
      actorStaffId: staffUser.id,
      action: isActive ? "KNOWLEDGE_DOCUMENT_ACTIVATED" : "KNOWLEDGE_DOCUMENT_DEACTIVATED",
      documentId,
    });

    revalidatePath("/knowledge-base");
    revalidatePath("/admin/knowledge");
    revalidatePath("/settings");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update knowledge document:", error);

    return {
      success: false,
      error: "Failed to update knowledge document.",
    };
  }
}

export async function deleteKnowledgeDocumentAction(documentId: number) {
  try {
    const staffUser = await requireAdminUser();
    const result = await prisma.$executeRaw`
      DELETE FROM "knowledge_documents"
      WHERE "id" = ${documentId}
        AND "restaurant_id" = ${staffUser.restaurantId}
    `;

    if (Number(result) === 0) {
      return {
        success: false,
        error: "Document was not found.",
      };
    }

    await writeKnowledgeAudit({
      restaurantId: staffUser.restaurantId,
      actorStaffId: staffUser.id,
      action: "KNOWLEDGE_DOCUMENT_DELETED",
      documentId,
    });

    revalidatePath("/knowledge-base");
    revalidatePath("/admin/knowledge");
    revalidatePath("/settings");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete knowledge document:", error);

    return {
      success: false,
      error: "Failed to delete knowledge document.",
    };
  }
}

async function writeKnowledgeAudit(input: {
  restaurantId: number;
  actorStaffId: number;
  action: string;
  documentId: number;
}) {
  await prisma.auditLog.create({
    data: {
      restaurantId: input.restaurantId,
      actorStaffId: input.actorStaffId,
      actorType: "STAFF",
      action: input.action,
      metadata: { documentId: input.documentId },
    },
  });
}

function revalidateKnowledgeAdmin() {
  revalidatePath("/knowledge-base");
  revalidatePath("/admin");
  revalidatePath("/admin/knowledge");
}

export async function validateKnowledgeDocumentAction(documentId: number) {
  const staffUser = await requireAdminUser();
  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, restaurantId: staffUser.restaurantId },
    include: { _count: { select: { chunks: true } } },
  });
  if (!document) return { success: false, error: "Document was not found." };

  const issues: Array<{ severity: "BLOCKING"; message: string }> = [];
  if (document.status !== "ready") {
    issues.push({ severity: "BLOCKING", message: "Document ingestion must complete successfully." });
  }
  if (document._count.chunks === 0) {
    issues.push({ severity: "BLOCKING", message: "Document must contain at least one retrievable chunk." });
  }
  const validation = { passed: issues.length === 0, issues, chunkCount: document._count.chunks };

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        publicationStatus: validation.passed ? "VALIDATED" : "DRAFT",
        validationResults: validation,
        validatedAt: validation.passed ? new Date() : null,
      },
    });
    await tx.auditLog.create({
      data: {
        restaurantId: staffUser.restaurantId,
        actorStaffId: staffUser.id,
        actorType: "STAFF",
        action: validation.passed ? "KNOWLEDGE_DOCUMENT_VALIDATED" : "KNOWLEDGE_DOCUMENT_VALIDATION_FAILED",
        metadata: { documentId: document.id, issues: issues.length },
      },
    });
  });
  revalidateKnowledgeAdmin();
  return { success: validation.passed, validation, error: validation.passed ? undefined : issues[0]?.message };
}

export async function approveKnowledgeDocumentAction(documentId: number) {
  const staffUser = await requireAdminUser();
  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, restaurantId: staffUser.restaurantId },
  });
  if (!document) return { success: false, error: "Document was not found." };
  if (document.publicationStatus !== "VALIDATED") {
    return { success: false, error: "Only a validated document can be approved." };
  }
  await prisma.knowledgeDocument.update({
    where: { id: document.id },
    data: { publicationStatus: "APPROVED", approvedAt: new Date() },
  });
  await writeKnowledgeAudit({
    restaurantId: staffUser.restaurantId,
    actorStaffId: staffUser.id,
    action: "KNOWLEDGE_DOCUMENT_APPROVED",
    documentId: document.id,
  });
  revalidateKnowledgeAdmin();
  return { success: true };
}

export async function publishKnowledgeDocumentAction(documentId: number) {
  const staffUser = await requireAdminUser();
  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, restaurantId: staffUser.restaurantId },
  });
  if (!document) return { success: false, error: "Document was not found." };
  const validation = document.validationResults as { passed?: boolean } | null;
  if (!canPublishKnowledgeDocument({
    ingestionStatus: document.status,
    publicationStatus: document.publicationStatus,
    validationPassed: validation?.passed === true,
  })) {
    return { success: false, error: "Only a ready, validated, and approved document can be published." };
  }
  await prisma.$transaction(async (tx) => {
    await tx.knowledgeDocument.updateMany({
      where: {
        restaurantId: staffUser.restaurantId,
        originalFilename: document.originalFilename,
        publicationStatus: "PUBLISHED",
        id: { not: document.id },
      },
      data: { publicationStatus: "ARCHIVED", isActive: false },
    });
    await tx.knowledgeDocument.update({
      where: { id: document.id },
      data: { publicationStatus: "PUBLISHED", isActive: true, publishedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        restaurantId: staffUser.restaurantId,
        actorStaffId: staffUser.id,
        actorType: "STAFF",
        action: "KNOWLEDGE_DOCUMENT_PUBLISHED",
        metadata: { documentId: document.id },
      },
    });
  });
  revalidateKnowledgeAdmin();
  return { success: true };
}
