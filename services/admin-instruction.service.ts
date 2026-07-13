import { Prisma } from "@prisma/client";
import { Client } from "pg";
import { prisma } from "@/lib/prisma";
import {
  assertInstructionStatusTransition,
  buildPublishedInstructionPrompt,
  runInstructionRegressionSuite,
  validateInstructionDraft,
} from "@/lib/domain/admin-content";

const DEFAULT_ROLE_PROMPT =
  "Help restaurant guests using only structured menu and published knowledge data. Never invent menu items, prices, allergens, ingredients, or availability.";
const DEFAULT_HANDOVER_PROMPT =
  "Immediately hand over uncertain allergen or cross-contamination questions, payment disputes, emergencies, complaints requiring a manager, and requests requiring physical staff action.";

async function executeAdminReleaseStatement(text: string, values: unknown[]) {
  const client = new Client({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/phygital_dining",
  });
  await client.connect();
  try {
    const result = await client.query(text, values);
    return result.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

function auditData(input: {
  restaurantId: number;
  actorStaffId: number;
  action: string;
  metadata?: Prisma.InputJsonValue;
}): Prisma.AuditLogCreateInput {
  return {
    restaurantId: input.restaurantId,
    actorStaffId: input.actorStaffId,
    actorType: "STAFF",
    action: input.action,
    metadata: input.metadata,
  };
}

export function listInstructionVersions(restaurantId: number) {
  return prisma.aiInstructionVersion.findMany({
    where: { restaurantId },
    orderBy: { version: "desc" },
  });
}

export function getInstructionVersion(restaurantId: number, id?: number) {
  return prisma.aiInstructionVersion.findFirst({
    where: id ? { id, restaurantId } : { restaurantId, status: "DRAFT" },
    orderBy: { version: "desc" },
  });
}

export async function getPublishedInstruction(restaurantId: number) {
  const version = await prisma.aiInstructionVersion.findFirst({
    where: { restaurantId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return version
    ? {
        id: version.id,
        version: version.version,
        prompt: buildPublishedInstructionPrompt(version),
      }
    : null;
}

export async function createInstructionDraft(input: {
  restaurantId: number;
  actorStaffId: number;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "restaurants" WHERE "id" = ${input.restaurantId} FOR UPDATE`;
    const existingDraft = await tx.aiInstructionVersion.findFirst({
      where: { restaurantId: input.restaurantId, status: "DRAFT" },
      orderBy: { version: "desc" },
    });
    if (existingDraft) return existingDraft;

    const latest = await tx.aiInstructionVersion.findFirst({
      where: { restaurantId: input.restaurantId },
      orderBy: { version: "desc" },
    });
    const published = await tx.aiInstructionVersion.findFirst({
      where: { restaurantId: input.restaurantId, status: "PUBLISHED" },
    });
    const draft = await tx.aiInstructionVersion.create({
      data: {
        restaurantId: input.restaurantId,
        version: (latest?.version ?? 0) + 1,
        status: "DRAFT",
        rolePrompt: published?.rolePrompt ?? DEFAULT_ROLE_PROMPT,
        handoverPrompt: published?.handoverPrompt ?? DEFAULT_HANDOVER_PROMPT,
        releaseNotes: "",
        createdByStaffId: input.actorStaffId,
      },
    });
    await tx.auditLog.create({
      data: auditData({
        ...input,
        action: "AI_INSTRUCTION_DRAFT_CREATED",
        metadata: { instructionVersionId: draft.id, version: draft.version },
      }),
    });
    return draft;
  });
}

export async function saveInstructionDraft(input: {
  restaurantId: number;
  actorStaffId: number;
  id: number;
  rolePrompt: string;
  handoverPrompt: string;
  releaseNotes: string;
}) {
  const version = await getInstructionVersion(input.restaurantId, input.id);
  if (!version) throw new Error("Instruction version was not found.");
  if (version.status !== "DRAFT") {
    throw new Error("Published or reviewed versions cannot be edited directly.");
  }
  if (!input.rolePrompt.trim() || !input.handoverPrompt.trim()) {
    throw new Error("Role and handover instructions are required.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.aiInstructionVersion.update({
      where: { id: version.id },
      data: {
        rolePrompt: input.rolePrompt.trim(),
        handoverPrompt: input.handoverPrompt.trim(),
        releaseNotes: input.releaseNotes.trim(),
        validationResults: Prisma.JsonNull,
        validatedAt: null,
      },
    });
    await tx.auditLog.create({
      data: auditData({
        restaurantId: input.restaurantId,
        actorStaffId: input.actorStaffId,
        action: "AI_INSTRUCTION_DRAFT_UPDATED",
        metadata: { instructionVersionId: version.id, version: version.version },
      }),
    });
    return updated;
  });
}

export async function validateInstructionVersion(input: {
  restaurantId: number;
  actorStaffId: number;
  id: number;
}) {
  const version = await getInstructionVersion(input.restaurantId, input.id);
  if (!version) throw new Error("Instruction version was not found.");
  if (version.status !== "DRAFT") {
    throw new Error("Only a draft can be validated.");
  }
  const validation = validateInstructionDraft(version);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.aiInstructionVersion.update({
      where: { id: version.id },
      data: {
        status: validation.passed ? "VALIDATED" : "DRAFT",
        validationResults: validation as unknown as Prisma.InputJsonValue,
        validatedAt: validation.passed ? new Date() : null,
      },
    });
    await tx.auditLog.create({
      data: auditData({
        ...input,
        action: validation.passed
          ? "AI_INSTRUCTION_VALIDATED"
          : "AI_INSTRUCTION_VALIDATION_FAILED",
        metadata: {
          instructionVersionId: version.id,
          version: version.version,
          issues: validation.issues.length,
        },
      }),
    });
    return { version: updated, validation };
  });
}

export async function markInstructionTested(input: {
  restaurantId: number;
  actorStaffId: number;
  id: number;
}) {
  const version = await getInstructionVersion(input.restaurantId, input.id);
  if (!version) throw new Error("Instruction version was not found.");
  assertInstructionStatusTransition(version.status as "VALIDATED", "TESTED");
  const testResults = runInstructionRegressionSuite(version);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.aiInstructionVersion.update({
      where: { id: version.id },
      data: {
        status: testResults.passed ? "TESTED" : "VALIDATED",
        testResults,
        testedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: auditData({
        ...input,
        action: testResults.passed
          ? "AI_INSTRUCTION_TESTED"
          : "AI_INSTRUCTION_TEST_FAILED",
        metadata: {
          instructionVersionId: version.id,
          version: version.version,
          passed: testResults.passed,
        },
      }),
    });
    return updated;
  });
}

export async function approveInstructionVersion(input: {
  restaurantId: number;
  actorStaffId: number;
  id: number;
}) {
  const version = await getInstructionVersion(input.restaurantId, input.id);
  if (!version) throw new Error("Instruction version was not found.");
  assertInstructionStatusTransition(version.status as "TESTED", "APPROVED");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.aiInstructionVersion.update({
      where: { id: version.id },
      data: {
        status: "APPROVED",
        approvedByStaffId: input.actorStaffId,
        approvedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: auditData({
        ...input,
        action: "AI_INSTRUCTION_APPROVED",
        metadata: { instructionVersionId: version.id, version: version.version },
      }),
    });
    return updated;
  });
}

export async function publishInstructionVersion(input: {
  restaurantId: number;
  actorStaffId: number;
  id: number;
}) {
  const version = await getInstructionVersion(input.restaurantId, input.id);
  if (!version) throw new Error("Instruction version was not found.");
  assertInstructionStatusTransition(version.status as "APPROVED", "PUBLISHED");
  const metadata = JSON.stringify({ instructionVersionId: version.id, version: version.version });
  const affected = await executeAdminReleaseStatement(`
    WITH locked AS (
      SELECT "id" FROM "restaurants"
      WHERE "id" = $1
      FOR UPDATE
    ), archived AS (
      UPDATE "ai_instruction_versions"
      SET "status" = 'ARCHIVED', "archived_at" = NOW(), "updated_at" = NOW()
      WHERE "restaurant_id" = (SELECT "id" FROM locked)
        AND "status" = 'PUBLISHED'
      RETURNING "id"
    ), published AS (
      UPDATE "ai_instruction_versions"
      SET "status" = 'PUBLISHED', "published_at" = NOW(), "archived_at" = NULL, "updated_at" = NOW()
      WHERE "id" = $2
        AND "restaurant_id" = $1
        AND "status" = 'APPROVED'
        AND (SELECT COUNT(*) FROM archived) >= 0
      RETURNING "id"
    )
    INSERT INTO "audit_logs" ("restaurant_id", "staff_user_id", "actor_type", "action", "metadata", "created_at")
    SELECT $1, $3, 'STAFF', 'AI_INSTRUCTION_PUBLISHED', $4::jsonb, NOW()
    FROM published
  `, [input.restaurantId, version.id, input.actorStaffId, metadata]);
  if (Number(affected) !== 1) throw new Error("The instruction version was not publishable.");
  return { ...version, status: "PUBLISHED", publishedAt: new Date(), archivedAt: null };
}

export async function rollbackInstructionVersion(input: {
  restaurantId: number;
  actorStaffId: number;
  targetId: number;
}) {
  const [target, current] = await Promise.all([
    prisma.aiInstructionVersion.findFirst({
      where: { id: input.targetId, restaurantId: input.restaurantId, status: "ARCHIVED" },
    }),
    prisma.aiInstructionVersion.findFirst({
      where: { restaurantId: input.restaurantId, status: "PUBLISHED" },
    }),
  ]);
  if (!target) throw new Error("Only an archived approved version can be restored.");
  const metadata = JSON.stringify({
    fromVersion: current?.version ?? null,
    toVersion: target.version,
    instructionVersionId: target.id,
  });
  const affected = await executeAdminReleaseStatement(`
    WITH locked AS (
      SELECT "id" FROM "restaurants"
      WHERE "id" = $1
      FOR UPDATE
    ), archived AS (
      UPDATE "ai_instruction_versions"
      SET "status" = 'ARCHIVED', "archived_at" = NOW(), "updated_at" = NOW()
      WHERE "restaurant_id" = (SELECT "id" FROM locked)
        AND "status" = 'PUBLISHED'
      RETURNING "id"
    ), restored AS (
      UPDATE "ai_instruction_versions"
      SET "status" = 'PUBLISHED', "published_at" = NOW(), "archived_at" = NULL, "updated_at" = NOW()
      WHERE "id" = $2
        AND "restaurant_id" = $1
        AND "status" = 'ARCHIVED'
        AND (SELECT COUNT(*) FROM archived) >= 0
      RETURNING "id"
    )
    INSERT INTO "audit_logs" ("restaurant_id", "staff_user_id", "actor_type", "action", "metadata", "created_at")
    SELECT $1, $3, 'STAFF', 'AI_INSTRUCTION_ROLLED_BACK', $4::jsonb, NOW()
    FROM restored
  `, [input.restaurantId, target.id, input.actorStaffId, metadata]);
  if (Number(affected) !== 1) throw new Error("The instruction version could not be restored.");
  return { ...target, status: "PUBLISHED", publishedAt: new Date(), archivedAt: null };
}
