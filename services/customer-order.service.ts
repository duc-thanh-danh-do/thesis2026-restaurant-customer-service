import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createCustomerSession } from "@/services/customer-session.service";
import {
  CUSTOMER_CONFIRMED_ORDER_STATUS,
  CUSTOMER_DRAFT_ORDER_STATUS,
} from "@/constants/orderStatus";

const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"] as const;
const MAX_ORDER_ITEM_QUANTITY = 100;
const MAX_ORDER_ITEM_TYPES = 50;
const MAX_ORDER_TOTAL = 99_999_999.99;

export type CreateUnconfirmedOrderInput = {
  qrToken: string;
  sessionToken?: string | null;
  items: Record<string, number>;
};

type OrderWithItems = Awaited<ReturnType<typeof getOrderWithItems>>;

function getOrderWithItems(
  client: Prisma.TransactionClient,
  orderId: number,
  sessionToken: string,
) {
  return client.order.findFirst({
    where: {
      id: orderId,
      session: { sessionToken },
    },
    include: {
      orderItems: {
        orderBy: { id: "asc" },
      },
    },
  });
}

function calculateOrderTotal(items: Array<{ price: unknown; quantity: number }>) {
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (!Number.isFinite(total) || total < 0 || total > MAX_ORDER_TOTAL) {
    throw new HttpError("Order total exceeds the supported limit", "ORDER_TOTAL_INVALID", 400);
  }

  return total;
}

export function normalizeRequestedOrderItems(items: Record<string, number>) {
  const requestedItems = Object.entries(items).map(([itemId, quantity]) => ({
    id: Number(itemId),
    quantity,
  }));

  if (requestedItems.length === 0 || requestedItems.length > MAX_ORDER_ITEM_TYPES) {
    throw new HttpError("Order must contain between 1 and 50 item types", "ORDER_ITEMS_INVALID", 400);
  }

  if (
    requestedItems.some(
      (item) =>
        !Number.isInteger(item.id) ||
        item.id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_ORDER_ITEM_QUANTITY,
    )
  ) {
    throw new HttpError("Order quantities must be whole numbers between 1 and 100", "ORDER_ITEMS_INVALID", 400);
  }

  return requestedItems;
}

export function assertOrderItemTypeLimit(
  existingItemNames: Iterable<string>,
  incomingItemNames: Iterable<string>,
) {
  const distinctItemNames = new Set([
    ...existingItemNames,
    ...incomingItemNames,
  ]);

  if (distinctItemNames.size > MAX_ORDER_ITEM_TYPES) {
    throw new HttpError(
      "An order cannot contain more than 50 item types",
      "ORDER_ITEM_TYPES_EXCEEDED",
      400,
    );
  }
}

export function serializeOrderDraft(order: NonNullable<OrderWithItems>) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
}

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

  const requestedItems = normalizeRequestedOrderItems(items);

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

  if (menuItems.length !== requestedItems.length) {
    throw new HttpError("One or more requested menu items are unavailable", "ORDER_ITEM_UNAVAILABLE", 409);
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

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${activeSession.id})`;

    const existingDraft = await tx.order.findFirst({
      where: {
        sessionId: activeSession.id,
        status: CUSTOMER_DRAFT_ORDER_STATUS,
      },
      include: { orderItems: true },
      orderBy: { createdAt: "desc" },
    });

    if (!existingDraft) {
      const order = await tx.order.create({
        data: {
          sessionId: activeSession.id,
          status: CUSTOMER_DRAFT_ORDER_STATUS,
          total: calculateOrderTotal(orderItems),
          orderItems: { create: orderItems },
        },
        include: { orderItems: true },
      });
      return { order, sessionToken: activeSession.sessionToken };
    }

    const existingItemsByName = new Map(
      existingDraft.orderItems.map((item) => [item.name, item]),
    );
    assertOrderItemTypeLimit(
      existingItemsByName.keys(),
      orderItems.map((item) => item.name),
    );
    for (const item of orderItems) {
      const existingItem = existingItemsByName.get(item.name);
      if (existingItem) {
        const nextQuantity = existingItem.quantity + item.quantity;
        if (nextQuantity > MAX_ORDER_ITEM_QUANTITY) {
          throw new HttpError("An item quantity cannot exceed 100", "ORDER_QUANTITY_INVALID", 400);
        }
        await tx.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.orderItem.create({
          data: { orderId: existingDraft.id, ...item },
        });
      }
    }

    const updatedItems = await tx.orderItem.findMany({ where: { orderId: existingDraft.id } });
    const updatedDraft = await tx.order.update({
      where: { id: existingDraft.id },
      data: { total: calculateOrderTotal(updatedItems) },
      include: { orderItems: { orderBy: { id: "asc" } } },
    });

    return { order: updatedDraft, sessionToken: activeSession.sessionToken };
  });
}

export async function confirmOrder(orderId: number, sessionToken: string) {
  if (!Number.isInteger(orderId)) {
    throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
  }

  if (!sessionToken.trim()) {
    throw new HttpError("Session token is required", "SESSION_TOKEN_REQUIRED", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${orderId})`;
    const order = await getOrderWithItems(tx, orderId, sessionToken);

    if (!order) throw new HttpError("Order not found", "ORDER_NOT_FOUND", 404);
    if (order.status !== CUSTOMER_DRAFT_ORDER_STATUS) {
      throw new HttpError("Only unconfirmed orders can be confirmed", "ORDER_NOT_UNCONFIRMED", 400);
    }
    if (order.orderItems.length === 0) {
      throw new HttpError("An empty order cannot be confirmed", "ORDER_EMPTY", 400);
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: CUSTOMER_CONFIRMED_ORDER_STATUS },
      include: { orderItems: { orderBy: { id: "asc" } } },
    });
  });
}

export async function updateDraftOrderItemQuantity({
  orderId,
  itemId,
  quantity,
  sessionToken,
}: {
  orderId: number;
  itemId: number;
  quantity: number;
  sessionToken: string;
}) {
  if (!Number.isInteger(orderId)) {
    throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
  }

  if (!Number.isInteger(itemId)) {
    throw new HttpError("Invalid order item id", "INVALID_ORDER_ITEM_ID", 400);
  }

  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_ORDER_ITEM_QUANTITY) {
    throw new HttpError("Invalid quantity", "INVALID_QUANTITY", 400);
  }

  if (!sessionToken.trim()) {
    throw new HttpError("Session token is required", "SESSION_TOKEN_REQUIRED", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${orderId})`;
    const order = await getOrderWithItems(tx, orderId, sessionToken);

    if (!order) throw new HttpError("Order not found", "ORDER_NOT_FOUND", 404);
    if (order.status !== CUSTOMER_DRAFT_ORDER_STATUS) {
      throw new HttpError("Only unconfirmed orders can be edited", "ORDER_NOT_UNCONFIRMED", 400);
    }

    const orderItem = order.orderItems.find((item) => item.id === itemId);
    if (!orderItem) {
      throw new HttpError("Order item not found", "ORDER_ITEM_NOT_FOUND", 404);
    }

    if (quantity === 0) {
      await tx.orderItem.delete({ where: { id: itemId } });
    } else {
      await tx.orderItem.update({ where: { id: itemId }, data: { quantity } });
    }

    const updatedItems = await tx.orderItem.findMany({ where: { orderId } });
    return tx.order.update({
      where: { id: orderId },
      data: { total: calculateOrderTotal(updatedItems) },
      include: { orderItems: { orderBy: { id: "asc" } } },
    });
  });
}
