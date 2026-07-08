import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import { createCustomerSession } from "@/services/customer-session.service";
import { CUSTOMER_DRAFT_ORDER_STATUS } from "@/constants/orderStatus";

const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"] as const;

export type CreateUnconfirmedOrderInput = {
  qrToken: string;
  sessionToken?: string | null;
  items: Record<string, number>;
};

export async function createUnconfirmedOrder({
  qrToken,
  sessionToken,
  items,
}: CreateUnconfirmedOrderInput) {
  if (!qrToken) throw new HttpError("QR token is required", "QR_TOKEN_REQUIRED", 400);
  if (!items) throw new HttpError("Order items are required", "ORDER_ITEMS_REQUIRED", 400);

  const table = await prisma.restaurantTable.findUnique({
    where: { qrCodeToken: qrToken },
  });

  if (!table) throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);

  const requestedItems = Object.entries(items)
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

  const session = sessionToken
    ? await prisma.customerSession.findFirst({
        where: {
          sessionToken,
          tableId: table.id,
          status: { in: [...ACTIVE_SESSION_STATUSES] },
        },
      })
    : null;

  const activeSession = session ?? (await createCustomerSession(qrToken)).session;

  const orderItems = menuItems
    .map((menuItem) => {
      const requestedItem = requestedItems.find((item) => item.id === menuItem.id);
      const quantity = requestedItem?.quantity ?? 0;

      return {
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity,
      };
    })
    .filter((item) => item.quantity > 0);

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = await prisma.order.create({
    data: {
      sessionId: activeSession.id,
      status: CUSTOMER_DRAFT_ORDER_STATUS,
      total,
      orderItems: {
        create: orderItems,
      },
    },
    include: {
      orderItems: true,
    },
  });

  return {
    order,
    sessionToken: activeSession.sessionToken,
  };
}
