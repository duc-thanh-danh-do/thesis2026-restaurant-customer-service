"use server";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { revalidatePath } from "next/cache";

type OrderItemRow = {
  id: number;
  name: string;
  price: number | string | { toString(): string };
  quantity: number;
};

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    // update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { success: false, error: "Database is unavailable. Please try again later." };
    }

    console.error(" Failed to update order status:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function getTestOrder() {
  try {
    const order = await prisma.order.findFirst({
      include: { orderItems: true },
    });

    if (!order) return null;

    return {
      id: order.id.toString(),
      time: "Just now",
      total: Number(order.total),
      status: order.status,
      items: order.orderItems.map((item: OrderItemRow) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    if (isDatabaseUnavailable(error)) return null;

    console.error("Failed to fetch test order:", error);
    return null;
  }
}

export async function getTableOrderAction(tableNumber: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        session: {
          table: {
            tableNumber: tableNumber,
          },
        },
        status: {
          notIn: ["Served", "Paid", "Cancelled"],
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
      status: order.status,
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
  newQuantity: number
) {
  try {
    if (newQuantity <= 0) {
      await prisma.orderItem.delete({ where: { id: itemId } });
    } else {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      });
    }

    const updatedItems = (await prisma.orderItem.findMany({
      where: { orderId },
    })) as OrderItemRow[];
    const newTotal = updatedItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // update total price
    await prisma.order.update({
      where: { id: orderId },
      data: { total: newTotal },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { success: false, error: "Database is unavailable. Please try again later." };
    }

    console.error("Failed to update quantity:", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function getActiveOrdersAction() {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          notIn: ["Served", "Paid", "Cancelled"],
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
