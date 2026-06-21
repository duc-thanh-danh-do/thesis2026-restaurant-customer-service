import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-errors";

const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      qrToken?: string;
      sessionToken?: string | null;
      items?: Record<string, number>;
    };

    if (!body.qrToken) throw new HttpError("QR token is required", "QR_TOKEN_REQUIRED", 400);
    if (!body.items) throw new HttpError("Order items are required", "ORDER_ITEMS_REQUIRED", 400);

    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: body.qrToken },
    });

    if (!table) throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);

    const requestedItems = Object.entries(body.items)
      .map(([itemId, quantity]) => ({
        id: Number(itemId),
        quantity,
      }))
      .filter((item) => Number.isInteger(item.id) && item.quantity > 0);

    if (requestedItems.length === 0) {
      throw new HttpError("Order has no valid items", "ORDER_EMPTY", 400);
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: requestedItems.map((item) => item.id) },
        restaurantId: table.restaurantId,
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    if (menuItems.length === 0) {
      throw new HttpError("Order has no available menu items", "ORDER_EMPTY", 400);
    }

    const session =
      body.sessionToken
        ? await prisma.customerSession.findFirst({
            where: {
              sessionToken: body.sessionToken,
              tableId: table.id,
              status: { in: ACTIVE_SESSION_STATUSES },
            },
          })
        : null;

    const activeSession =
      session ??
      (await prisma.customerSession.create({
        data: {
          restaurantId: table.restaurantId,
          tableId: table.id,
          sessionToken: `sess_${randomUUID()}`,
          status: "active",
          startedAt: new Date(),
        },
      }));

    const orderItems = menuItems.map((menuItem) => {
      const requestedItem = requestedItems.find((item) => item.id === menuItem.id);
      const quantity = requestedItem?.quantity ?? 0;

      return {
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity,
      };
    }).filter((item) => item.quantity > 0);

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        sessionId: activeSession.id,
        status: "preparing",
        total,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    return Response.json(
      {
        order,
        sessionToken: activeSession.sessionToken,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
