import { prisma } from "@/lib/prisma";

export function findTableByQrToken(qrCodeToken: string) {
  return prisma.restaurantTable.findUnique({
    where: { qrCodeToken },
    include: { restaurant: true },
  });
}

export function findSessionByToken(sessionToken: string) {
  return prisma.customerSession.findUnique({
    where: { sessionToken },
    include: {
      restaurant: true,
      table: true,
      chatMessages: { orderBy: { id: "asc" } },
      customerRequests: { orderBy: { id: "asc" } },
    },
  });
}
