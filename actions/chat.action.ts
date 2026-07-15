"use server";

import { prisma } from "@/lib/prisma";

export async function getTableMessagesAction(tableId: string | number) {
    try {

      const activeSession = await prisma.customerSession.findFirst({
        where: {
          tableId: Number(tableId),
          endedAt: null,          
        },
        orderBy: {
            startedAt: "desc", 
          },
      });
  
      if (!activeSession) {
        return []; 
      }
  
      const messages = await prisma.chatMessage.findMany({
        where: {
          sessionId: activeSession.id,
        },
        orderBy: {
          createdAt: "asc", 
        },
      });
  
      return messages.map((msg) => ({
        id: msg.id,
        role: msg.senderType, 
        content: msg.messageContent, 
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error(`Failed to fetch messages for table ${tableId}:`, error);
      return [];
    }
  }
