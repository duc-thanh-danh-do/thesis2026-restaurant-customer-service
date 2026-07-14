"use server";

import { getCurrentStaffUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { revalidatePath } from "next/cache";
import { ORDER_STATUS, type OrderStatus } from "@/constants/orderStatus";

type OrderItemRow = {
  id: number;
  name: string;
  price: number | string | { toString(): string };
  quantity: number;
};

const CLOSED_ORDER_STATUSES = [
  "Paid",
  "paid",
  "Cancelled",
  "cancelled",
];
const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"];

const STAFF_ORDER_TRANSITIONS: Record<Exclude<OrderStatus, "unconfirmed">, OrderStatus[]> = {
  placed: ["preparing"],
  preparing: ["ready"],
  ready: ["served"],
  served: [],
};

function normalizeOrderStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "placed") return "Placed";
  if (normalized === "preparing") return "Preparing";
  if (normalized === "ready") return "Ready";
  if (normalized === "served") return "Served";
  if (normalized === "paid") return "Paid";
  if (normalized === "cancelled") return "Cancelled";

  return status.trim();
}

export async function updateOrderStatus(orderId: number, status: string) {
  const requestedStatus = status.trim().toLowerCase();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { success: false, error: "Invalid order id." };
  }
  if (!ORDER_STATUS.includes(requestedStatus as OrderStatus) || requestedStatus === "unconfirmed") {
    return { success: false, error: "Unsupported order status." };
  }

  try {
    const staffUser = await getCurrentStaffUser();

    if (!staffUser) {
      return { success: false, error: "Staff sign in is required." };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${orderId})`;
      const order = await tx.order.findFirst({
        where: { id: orderId, session: { restaurantId: staffUser.restaurantId } },
        select: { id: true, status: true },
      });

      if (!order) return { success: false as const, error: "Order not found." };
      if (!STAFF_ORDER_TRANSITIONS[order.status as Exclude<OrderStatus, "unconfirmed">]?.includes(requestedStatus as OrderStatus)) {
        return { success: false as const, error: "Invalid order status transition." };
      }

      await tx.order.update({ where: { id: order.id }, data: { status: requestedStatus } });
      return { success: true as const, status: normalizeOrderStatus(requestedStatus) };
    });

    if (!result.success) return result;

    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error(" Failed to update order status:", error);
    return { success: false, error: "Database update failed" };
  }
}

// export async function getTestOrder() {
//   try {
//     const order = await prisma.order.findFirst({
//       include: { orderItems: true },
//     });

//     if (!order) return null;

//     return {
//       id: order.id.toString(),
//       time: "Just now",
//       total: Number(order.total),
//       status: order.status,
//       items: order.orderItems.map((item: OrderItemRow) => ({
//         id: item.id,
//         name: item.name,
//         price: Number(item.price),
//         quantity: item.quantity,
//       })),
//     };
//   } catch (error) {
//     console.error("Failed to fetch test order:", error);
//     return null;
//   }
// }

export async function getTableOrderAction(tableNumber: string) {
  try {
    const staffUser = await getCurrentStaffUser();

    if (!staffUser) return null;

    const order = await prisma.order.findFirst({
      where: {
        session: {
          restaurantId: staffUser.restaurantId,
          status: {
            in: ACTIVE_SESSION_STATUSES,
          },
          table: {
            tableNumber: tableNumber,
          },
        },
        status: {
          notIn: CLOSED_ORDER_STATUSES,
        },
      },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!order) return null;

    return {
      id: order.id.toString(),
      time: order.createdAt
        ? new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Just now",
      total: Number(order.total),
      status: normalizeOrderStatus(order.status),
      items: order.orderItems.map((item: OrderItemRow) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    console.error(`Failed to fetch order for table ${tableNumber}:`, error);
    return null;
  }
}

export async function updateItemQuantityAction(
  orderId: number,
  itemId: number,
  newQuantity: number,
) {
  if (
    !Number.isInteger(orderId) ||
    orderId <= 0 ||
    !Number.isInteger(itemId) ||
    itemId <= 0 ||
    !Number.isInteger(newQuantity) ||
    newQuantity < 0 ||
    newQuantity > 100
  ) {
    return { success: false, error: "Invalid order item quantity." };
  }

  try {
    const staffUser = await getCurrentStaffUser();

    if (!staffUser) {
      return { success: false, error: "Staff sign in is required." };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${orderId})`;
      const order = await tx.order.findFirst({
        where: { id: orderId, session: { restaurantId: staffUser.restaurantId } },
        select: { id: true },
      });
      if (!order) return { success: false as const, error: "Order not found." };

      if (newQuantity === 0) {
        const deleted = await tx.orderItem.deleteMany({ where: { id: itemId, orderId: order.id } });
        if (deleted.count === 0) return { success: false as const, error: "Order item not found." };
      } else {
        const updated = await tx.orderItem.updateMany({
          where: { id: itemId, orderId: order.id },
          data: { quantity: newQuantity },
        });
        if (updated.count === 0) return { success: false as const, error: "Order item not found." };
      }

      const updatedItems = (await tx.orderItem.findMany({ where: { orderId: order.id } })) as OrderItemRow[];
      const newTotal = updatedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      if (!Number.isFinite(newTotal) || newTotal < 0 || newTotal > 99_999_999.99) {
        throw new Error("Order total exceeds the supported limit.");
      }
      await tx.order.update({ where: { id: order.id }, data: { total: newTotal } });
      return { success: true as const };
    });

    if (!result.success) return result;

    revalidatePath("/dashboard");
    return result;
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to update quantity:", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function getActiveOrdersAction() {
  try {
    const staffUser = await getCurrentStaffUser();

    if (!staffUser) return [];

    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          notIn: CLOSED_ORDER_STATUSES,
        },
        session: {
          restaurantId: staffUser.restaurantId,
          status: {
            in: ACTIVE_SESSION_STATUSES,
          },
        },
      },
      include: {
        session: {
          include: {
            table: true,
          },
        },
        orderItems: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return activeOrders.map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
      total: Number(order.total),
      orderItems: order.orderItems.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch active orders:", error);
    return [];
  }
}
