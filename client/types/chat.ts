export type CustomerSessionResponse = {
  sessionToken: string;
  session: {
    id: number;
    restaurantId: number;
    tableId: number;
    sessionToken: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
  };
  restaurant: {
    id: number;
    name: string;
    description?: string | null;
    address?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  table: {
    id: number;
    restaurantId: number;
    tableNumber: string;
    qrCodeToken: string;
    isActive: boolean;
    createdAt?: string | null;
  };
};

export type ChatMessageResponse = {
  reply: string;
  handoverRequired: boolean;
  requestId: number | null;
  sessionStatus: string;
  aiMessage: {
    id: number;
    sessionId: number;
    senderType: string;
    messageContent: string;
    createdAt: string;
  };
};

export type UiChatMessage = {
  id: string;
  sender: "customer" | "ai" | "system";
  content: string;
};