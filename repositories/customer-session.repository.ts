import { prisma } from "@/lib/prisma";

export function findTableByQrToken(qrCodeToken: string) {
  return prisma.restaurantTable.findUnique({
    where: { qrCodeToken },
    include: { restaurant: true },
  });
}

export function findActiveDiningSessionByTableId(tableId: number) {
  return prisma.diningSession.findFirst({
    where: {
      tableId,
      status: { in: ["active", "waiting_staff"] },
    },
    orderBy: { startedAt: "desc" },
  });
}

export function findSessionByToken(sessionToken: string) {
  return prisma.customerSession.findUnique({
    where: { sessionToken },
    include: {
      diningSession: true,
      restaurant: true,
      table: true,
      chatMessages: { orderBy: { id: "asc" } },
      customerRequests: { orderBy: { id: "asc" } },
    },
  });
}
