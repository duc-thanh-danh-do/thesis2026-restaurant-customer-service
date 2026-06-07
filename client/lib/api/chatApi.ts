import type { ChatMessageResponse } from "../../types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function sendChatMessage(
  sessionToken: string,
  message: string,
): Promise<ChatMessageResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const response = await fetch(`${API_BASE_URL}/chat/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionToken,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat message");
  }

  return response.json();
}