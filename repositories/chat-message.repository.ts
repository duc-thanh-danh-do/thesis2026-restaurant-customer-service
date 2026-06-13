import { prisma } from "@/lib/prisma";

export function createChatMessage(
  sessionId: number,
  senderType: "customer" | "ai" | "staff",
  messageContent: string,
) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      senderType,
      messageContent,
      createdAt: new Date(),
    },
  });
}
