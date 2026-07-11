import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import {
  canUseCustomerFallbackData,
  fallbackRestaurant,
  fallbackTables,
  isDatabaseUnavailable,
} from "@/lib/fallback-data";
import {
  findSessionByToken,
  findTableByQrToken,
} from "@/repositories/customer-session.repository";

export async function createCustomerSession(qrCodeToken: string) {
  try {
    const table = await findTableByQrToken(qrCodeToken);

    if (!table) throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);
    if (!table.isActive) throw new HttpError("Restaurant table is inactive", "TABLE_INACTIVE", 400);

    const { restaurant, ...tableResponse } = table;
    const diningSession = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${table.id})`;

      return (
        (await transaction.diningSession.findFirst({
          where: {
            tableId: table.id,
            status: { in: ["active", "waiting_staff"] },
          },
          orderBy: { startedAt: "desc" },
        })) ??
        (await transaction.diningSession.create({
          data: {
            restaurantId: table.restaurantId,
            tableId: table.id,
            status: "active",
            startedAt: new Date(),
          },
        }))
      );
    });

    const sessionToken = `sess_${randomUUID()}`;
    const session = await prisma.customerSession.create({
      data: {
        diningSessionId: diningSession.id,
        restaurantId: table.restaurantId,
        tableId: table.id,
        sessionToken,
        status: "active",
        startedAt: new Date(),
      },
    });

    return {
      sessionToken,
      session,
      diningSession,
      restaurant,
      table: tableResponse,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseCustomerFallbackData()) {
      throw new HttpError("Customer sessions are temporarily unavailable.", "DATABASE_UNAVAILABLE", 503);
    }

    const table = fallbackTables.find((record) => record.qrCodeToken === qrCodeToken);

    if (!table) throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);
    if (!table.isActive) throw new HttpError("Restaurant table is inactive", "TABLE_INACTIVE", 400);

    const sessionToken = `sess_${randomUUID()}`;

    return {
      sessionToken,
      session: {
        id: Date.now(),
        diningSessionId: Date.now(),
        restaurantId: fallbackRestaurant.id,
        tableId: table.id,
        sessionToken,
        status: "active",
        startedAt: new Date(),
        endedAt: null,
      },
      diningSession: {
        id: Date.now(),
        restaurantId: fallbackRestaurant.id,
        tableId: table.id,
        status: "active",
        startedAt: new Date(),
        endedAt: null,
      },
      restaurant: fallbackRestaurant,
      table,
      fallback: true,
    };
  }
}

export async function getCustomerSession(sessionToken: string) {
  try {
    const session = await findSessionByToken(sessionToken);

    if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);

    return { session };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseCustomerFallbackData()) {
      throw new HttpError("Customer sessions are temporarily unavailable.", "DATABASE_UNAVAILABLE", 503);
    }

    return {
      session: {
        id: 1,
        diningSessionId: 1,
        restaurantId: fallbackRestaurant.id,
        tableId: 1,
        sessionToken,
        status: "active",
        restaurant: fallbackRestaurant,
        table: fallbackTables[0],
        chatMessages: [],
        customerRequests: [],
      },
      fallback: true,
    };
  }
}

export async function closeCustomerSession(sessionToken: string) {
  try {
    const session = await prisma.customerSession.findUnique({ where: { sessionToken } });

    if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);

    return prisma.customerSession.update({
      where: { sessionToken },
      data: {
        status: "closed",
        endedAt: new Date(),
      },
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseCustomerFallbackData()) {
      throw new HttpError("Customer sessions are temporarily unavailable.", "DATABASE_UNAVAILABLE", 503);
    }

    return {
      id: 1,
      sessionToken,
      status: "closed",
      endedAt: new Date(),
    };
  }
}
