import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import { createCustomerSession } from "@/services/customer-session.service";
import {
  CUSTOMER_CONFIRMED_ORDER_STATUS,
  CUSTOMER_DRAFT_ORDER_STATUS,
} from "@/constants/orderStatus";

const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"] as const;

export type CreateUnconfirmedOrderInput = {
  qrToken: string;
  sessionToken?: string | null;
  items: Record<string, number>;
};

type OrderWithItems = Awaited<ReturnType<typeof getOrderWithItems>>;

function getOrderWithItems(orderId: number) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        orderBy: { id: "asc" },
      },
    },
  });
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

  const existingDraft = await prisma.order.findFirst({
    where: {
      sessionId: activeSession.id,
      status: CUSTOMER_DRAFT_ORDER_STATUS,
    },
    include: {
      orderItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingDraft) {
    for (const item of orderItems) {
      const existingItem = existingDraft.orderItems.find(
        (orderItem) => orderItem.name === item.name,
      );

      if (existingItem) {
        await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: existingDraft.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          },
        });
      }
    }

    const updatedItems = await prisma.orderItem.findMany({
      where: { orderId: existingDraft.id },
    });
    const updatedTotal = updatedItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    const updatedDraft = await prisma.order.update({
      where: { id: existingDraft.id },
      data: { total: updatedTotal },
      include: {
        orderItems: {
          orderBy: { id: "asc" },
        },
      },
    });

    return {
      order: updatedDraft,
      sessionToken: activeSession.sessionToken,
    };
  }

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

export async function confirmOrder(orderId: number) {
  if (!Number.isInteger(orderId)) {
    throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
  }

  const order = await getOrderWithItems(orderId);

  if (!order) throw new HttpError("Order not found", "ORDER_NOT_FOUND", 404);
  if (order.status !== CUSTOMER_DRAFT_ORDER_STATUS) {
    throw new HttpError("Only unconfirmed orders can be confirmed", "ORDER_NOT_UNCONFIRMED", 400);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: CUSTOMER_CONFIRMED_ORDER_STATUS },
    include: {
      orderItems: {
        orderBy: { id: "asc" },
      },
    },
  });
}

export async function updateDraftOrderItemQuantity({
  orderId,
  itemId,
  quantity,
}: {
  orderId: number;
  itemId: number;
  quantity: number;
}) {
  if (!Number.isInteger(orderId)) {
    throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
  }

  if (!Number.isInteger(itemId)) {
    throw new HttpError("Invalid order item id", "INVALID_ORDER_ITEM_ID", 400);
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new HttpError("Invalid quantity", "INVALID_QUANTITY", 400);
  }

  const order = await getOrderWithItems(orderId);

  if (!order) throw new HttpError("Order not found", "ORDER_NOT_FOUND", 404);
  if (order.status !== CUSTOMER_DRAFT_ORDER_STATUS) {
    throw new HttpError("Only unconfirmed orders can be edited", "ORDER_NOT_UNCONFIRMED", 400);
  }

  const orderItem = order.orderItems.find((item) => item.id === itemId);
  if (!orderItem) {
    throw new HttpError("Order item not found", "ORDER_ITEM_NOT_FOUND", 404);
  }

  if (quantity === 0) {
    await prisma.orderItem.delete({
      where: { id: itemId },
    });
  } else {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  const updatedItems = await prisma.orderItem.findMany({
    where: { orderId },
  });
  const updatedTotal = updatedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  return prisma.order.update({
    where: { id: orderId },
    data: { total: updatedTotal },
    include: {
      orderItems: {
        orderBy: { id: "asc" },
      },
    },
  });
}
