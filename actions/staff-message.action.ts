"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { getCurrentStaffUser } from "@/lib/auth";

export async function sendStaffMessageAction(sessionId: number, message: string) {
  const trimmedMessage = message.trim();

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { success: false, error: "Invalid session." };
  }

  if (!trimmedMessage) {
    return { success: false, error: "Message is required." };
  }

  try {
    const staffUser = await getCurrentStaffUser();
    if (!staffUser) {
      return { success: false, error: "Staff sign in is required." };
    }

    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "staff",
        messageContent: trimmedMessage,
        createdAt: new Date(),
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { success: false, error: "Database is unavailable. Please try again later." };
    }

    console.error("Failed to send staff message:", error);
    return { success: false, error: "Unable to send message. Please try again." };
  }
}
