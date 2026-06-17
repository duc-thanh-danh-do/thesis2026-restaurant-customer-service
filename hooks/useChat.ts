import { useState } from "react";
import type { UiChatMessage } from "@/types/chat-message";

export function useChat(initialMessages: UiChatMessage[] = []) {
  return useState<UiChatMessage[]>(initialMessages);
}
