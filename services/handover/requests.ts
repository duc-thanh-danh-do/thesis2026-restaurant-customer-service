import { prisma } from "@/lib/prisma";
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
  const requestType = decision.requestType;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sessionId})`;

    const session = await tx.customerSession.findUnique({
      where: { id: sessionId },
      select: { diningSessionId: true, restaurantId: true },
    });
    if (!session) throw new Error("Customer session was not found for handover.");

    const existingRequest = await tx.customerRequest.findFirst({
      where: {
        sessionId,
        requestType,
        status: { in: OPEN_REQUEST_STATUSES },
      },
      orderBy: { id: "desc" },
    });

    const request =
      existingRequest ??
      (await tx.customerRequest.create({
        data: {
          sessionId,
          requestType,
          status: "pending",
          description: buildHandoverDescription(customerMessage, decision),
          createdAt: new Date(),
        },
      }));

    await tx.customerSession.update({
      where: { id: sessionId },
      data: { status: "waiting_staff" },
    });
    const diningSessionUpdate = await tx.diningSession.updateMany({
      where: {
        id: session.diningSessionId,
        restaurantId: session.restaurantId,
      },
      data: { status: "waiting_staff" },
    });
    if (diningSessionUpdate.count !== 1) {
      throw new Error("Dining session was not updated for handover.");
    }

    return {
      requestId: request.id,
      created: !existingRequest,
    };
  });
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
