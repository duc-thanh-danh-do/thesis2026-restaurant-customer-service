import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { HandoverDecision } from "@/services/handover/types";

export async function updateAiLogHandoverReason({
  logId,
  decision,
}: {
  logId: number;
  decision: HandoverDecision;
}) {
  if (!decision.required) return;

  try {
    await prisma.$executeRaw`
      UPDATE "ai_response_logs"
      SET
        "handover_reason" = ${decision.reason},
        "handover_rule_id" = ${decision.ruleId}
      WHERE "id" = ${logId}
    `;
  } catch (error) {
    logger.error("Failed to store AI handover rule details", error);
  }
}
