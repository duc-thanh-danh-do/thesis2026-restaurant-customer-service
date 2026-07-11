"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { getCurrentStaffUser } from "@/lib/auth";

type StaffMessageActionDeps = {
  getCurrentStaffUser: () => Promise<{ restaurantId: number } | null>;
  findOwnedSession: (input: {
    id: number;
    restaurantId: number;
  }) => Promise<{ id: number } | null>;
  createMessage: (input: {
    sessionId: number;
    messageContent: string;
  }) => Promise<{
    id: number;
    sessionId: number;
    senderType: string;
    messageContent: string;
    createdAt: Date | null;
  }>;
  isDatabaseUnavailable: (error: unknown) => boolean;
  revalidatePath: (path: string) => void;
};

type StaffMessageActionResult =
  | {
      success: true;
      message: {
        id: number;
        senderType: string;
        messageContent: string;
        createdAt: Date | null;
      };
    }
  | { success: false; error: string };

async function sendStaffMessageActionCore(
  deps: StaffMessageActionDeps,
  sessionId: number,
  message: string,
): Promise<StaffMessageActionResult> {
  const trimmedMessage = message.trim();

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { success: false, error: "Invalid session." };
  }

  if (!trimmedMessage) {
    return { success: false, error: "Message is required." };
  }

  try {
    const staffUser = await deps.getCurrentStaffUser();
    if (!staffUser) {
      return { success: false, error: "Staff sign in is required." };
    }

    const ownedSession = await deps.findOwnedSession({
      id: sessionId,
      restaurantId: staffUser.restaurantId,
    });
    if (!ownedSession) {
      return { success: false, error: "Session not found." };
    }

    const messageRecord = await deps.createMessage({
      sessionId,
      messageContent: trimmedMessage,
    });

    deps.revalidatePath(`/sessions/${sessionId}`);
    deps.revalidatePath("/sessions");
    deps.revalidatePath("/dashboard");

    return {
      success: true,
      message: {
        id: messageRecord.id,
        senderType: messageRecord.senderType,
        messageContent: messageRecord.messageContent,
        createdAt: messageRecord.createdAt,
      },
    };
  } catch (error) {
    if (deps.isDatabaseUnavailable(error)) {
      return { success: false, error: "Database is unavailable. Please try again later." };
    }

    console.error("Failed to send staff message:", error);
    return { success: false, error: "Unable to send message. Please try again." };
  }
}

export async function sendStaffMessageAction(sessionId: number, message: string) {
  return sendStaffMessageActionCore(
    {
      getCurrentStaffUser,
      findOwnedSession: ({ id, restaurantId }) =>
        prisma.customerSession.findFirst({
          where: { id, restaurantId },
          select: { id: true },
        }),
      createMessage: ({ sessionId: ownedSessionId, messageContent }) =>
        prisma.chatMessage.create({
          data: {
            sessionId: ownedSessionId,
            senderType: "staff",
            messageContent,
            createdAt: new Date(),
          },
        }),
      isDatabaseUnavailable,
      revalidatePath,
    },
    sessionId,
    message,
  );
}

export { sendStaffMessageActionCore as sendStaffMessageActionForTest };
