import { prisma } from "@/lib/prisma";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getAdminDashboardData(restaurantId: number) {
  const today = startOfToday();
  const [restaurant, published, drafts, menuCount, documentCount, healthyDocuments, responsesToday, handoversToday, recentLogs] =
    await Promise.all([
      prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { name: true } }),
      prisma.aiInstructionVersion.findFirst({
        where: { restaurantId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.aiInstructionVersion.count({ where: { restaurantId, status: "DRAFT" } }),
      prisma.menuItem.count({ where: { restaurantId } }),
      prisma.knowledgeDocument.count({ where: { restaurantId } }),
      prisma.knowledgeDocument.count({
        where: { restaurantId, status: "ready", publicationStatus: "PUBLISHED", isActive: true },
      }),
      prisma.aiResponseLog.count({ where: { session: { restaurantId }, createdAt: { gte: today } } }),
      prisma.aiResponseLog.count({
        where: { session: { restaurantId }, createdAt: { gte: today }, handoverRequired: true },
      }),
      prisma.aiResponseLog.findMany({
        where: { session: { restaurantId } },
        include: { instructionVersion: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    restaurantName: restaurant?.name ?? "Restaurant",
    publishedVersion: published ? `v${published.version}` : "None",
    drafts,
    menuCount,
    documentCount,
    knowledgeHealth: documentCount === 0 ? 0 : Math.round((healthyDocuments / documentCount) * 100),
    responsesToday,
    handoversToday,
    recentLogs,
  };
}

export async function getAdminMonitoringData(restaurantId: number) {
  const today = startOfToday();
  const [versions, logs, responsesToday, handoversToday, auditLogs] = await Promise.all([
    prisma.aiInstructionVersion.findMany({
      where: { restaurantId },
      orderBy: { version: "desc" },
    }),
    prisma.aiResponseLog.findMany({
      where: { session: { restaurantId } },
      include: { instructionVersion: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.aiResponseLog.count({ where: { session: { restaurantId }, createdAt: { gte: today } } }),
    prisma.aiResponseLog.count({
      where: { session: { restaurantId }, createdAt: { gte: today }, handoverRequired: true },
    }),
    prisma.auditLog.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    versions,
    logs,
    responsesToday,
    handoversToday,
    flaggedOutputs: logs.filter((log) => log.handoverRequired).length,
    auditLogs,
  };
}
