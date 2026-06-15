"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
      items: order.orderItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch test order:", error);
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

    const updatedItems = await prisma.orderItem.findMany({
      where: { orderId },
    });
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
    console.error("Failed to update quantity:", error);
    return { success: false, error: "Failed to update item" };
  }
}
