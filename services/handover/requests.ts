import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  OPEN_REQUEST_STATUSES,
  type HandoverDecision,
} from "@/services/handover/types";

export async function createStaffHandover({
  sessionId,
  customerMessage,
  decision,
}: {
  sessionId: number;
  customerMessage: string;
  decision: HandoverDecision;
}) {
  if (!decision.required || !decision.requestType) return null;

  const existingRequest = await prisma.customerRequest.findFirst({
    where: {
      sessionId,
      requestType: decision.requestType,
      status: { in: OPEN_REQUEST_STATUSES },
    },
    orderBy: { id: "desc" },
  });

  const request =
    existingRequest ??
    (await prisma.customerRequest.create({
      data: {
        sessionId,
        requestType: decision.requestType,
        status: "pending",
        description: buildHandoverDescription(customerMessage, decision),
        createdAt: new Date(),
      },
    }));

  await prisma.customerSession.update({
    where: { id: sessionId },
    data: { status: "waiting_staff" },
  });
  await markDiningSessionWaitingForStaff(sessionId);

  return {
    requestId: request.id,
    created: !existingRequest,
  };
}

function buildHandoverDescription(
  customerMessage: string,
  decision: HandoverDecision,
) {
  return [
    `AI handover: ${decision.ruleName ?? decision.category ?? "Staff assistance"}.`,
    decision.reason,
    `Customer message: ${customerMessage}`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function markDiningSessionWaitingForStaff(sessionId: number) {
  try {
    await prisma.$executeRaw`
      UPDATE "dining_sessions"
      SET "status" = 'waiting_staff'
      WHERE "id" = (
        SELECT "dining_session_id"
        FROM "customer_sessions"
        WHERE "id" = ${sessionId}
      )
    `;
  } catch (error) {
    logger.error("Failed to mark dining session as waiting_staff", error);
  }
}
