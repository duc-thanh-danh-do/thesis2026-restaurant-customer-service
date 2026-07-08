"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Bot, Droplet, Send, Shield } from "lucide-react";
import {
  CustomerBottomNav,
  CustomerMobileHeader,
  CustomerMobileLayout,
} from "@/components/layout/CustomerMobileLayout";

const cartStorageKey = "bistro-demo-cart";

function getCartCount() {
  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (!savedCart) return 0;

  try {
    const cart = JSON.parse(savedCart) as Record<string, number>;
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  } catch {
    return 0;
  }
}

type Message = {
  id: string;
  sender: "assistant" | "user";
  content: string;
  timestamp: Date;
};

type SessionPayload = {
  session: {
    sessionToken: string;
    status: string;
    table: {
      qrCodeToken: string;
    };
    chatMessages?: Array<{
      id: number;
      senderType: "customer" | "ai" | "staff";
      messageContent: string;
      createdAt: string | null;
    }>;
  };
};

function mapChatMessage(message: NonNullable<SessionPayload["session"]["chatMessages"]>[number]): Message {
  return {
    id: String(message.id),
    sender: message.senderType === "customer" ? "user" : "assistant",
    content: message.messageContent,
    timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
  };
}

function createWelcomeMessage(restaurantName: string, tableNumber: string) {
  return {
    id: "welcome",
    sender: "assistant" as const,
    content: `Welcome to ${restaurantName}, table ${tableNumber}. How can I help you today?`,
    timestamp: new Date(),
  };
}

export default function CustomerTableChat({
  qrToken,
  restaurantName,
  tableNumber,
}: {
  qrToken: string;
  restaurantName: string;
  tableNumber: string;
}) {
  const basePath = `/table/${qrToken}`;
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const welcomeMessage = createWelcomeMessage(restaurantName, tableNumber);

      setMessages([welcomeMessage]);
      setCartCount(getCartCount());
      try {
        const savedSessionToken = window.localStorage.getItem("dining-session-token");

        if (savedSessionToken) {
          const response = await fetch(`/api/customer-sessions/${savedSessionToken}`);

          if (response.ok) {
            const payload = (await response.json()) as SessionPayload;
            const isSameTable = payload.session.table.qrCodeToken === qrToken;
            const isActive = ["active", "waiting_staff"].includes(payload.session.status);

            if (isSameTable && isActive) {
              setSessionToken(payload.session.sessionToken);
              setMessages(
                payload.session.chatMessages?.length
                  ? payload.session.chatMessages.map(mapChatMessage)
                  : [welcomeMessage],
              );
              return;
            }
          }
        }

        const response = await fetch("/api/customer-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCodeToken: qrToken }),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { sessionToken: string };
        window.localStorage.setItem("dining-session-token", payload.sessionToken);
        setSessionToken(payload.sessionToken);
      } catch {
        setSessionToken(null);
      }
    }

    loadSession();
  }, [qrToken, restaurantName, tableNumber]);

  const sendMessage = async (content = message) => {
    const trimmedMessage = content.trim();
    if (!trimmedMessage || !sessionToken || isAssistantTyping) return;

    const now = new Date();
    setMessages((current) => [
      ...current,
      {
        id: `user-${now.getTime()}`,
        sender: "user",
        content: trimmedMessage,
        timestamp: now,
      },
    ]);
    setMessage("");
    setIsAssistantTyping(true);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, message: trimmedMessage }),
      });

      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            sender: "assistant",
            content:
              "The assistant could not answer right now. Please try again or ask restaurant staff for help.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const payload = (await response.json()) as {
        reply: string;
        aiMessage: { id: number; createdAt?: string | null };
      };

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${payload.aiMessage.id}`,
          sender: "assistant",
          content: payload.reply,
          timestamp: payload.aiMessage.createdAt
            ? new Date(payload.aiMessage.createdAt)
            : new Date(),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          content:
            "The assistant could not answer right now. Please try again or ask restaurant staff for help.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  return (
    <CustomerMobileLayout>
      <CustomerMobileHeader
        title={`Ask the assistant - Table ${tableNumber}`}
        rightElement={
          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Service active
          </span>
        }
      />

      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#d5e1ec] bg-white px-4 py-3">
        <div className="min-w-0">
          <span className="text-sm font-medium text-[#142653]">
            {restaurantName}
          </span>
          <p className="text-xs text-gray-500">Table {tableNumber} session active</p>
        </div>
        <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          Ready
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f5f9fc] px-4 py-4">
        <div className="w-full space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`flex max-w-[88%] items-start gap-2 ${
                  msg.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.sender === "assistant" ? "bg-[#438ed8]" : "bg-[#142653]"
                  }`}
                >
                  {msg.sender === "assistant" ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-bold text-white">You</span>
                  )}
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.sender === "assistant"
                      ? "border border-[#d5e1ec] bg-white"
                      : "bg-[#142653] text-white"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      msg.sender === "assistant"
                        ? "text-gray-500"
                        : "text-white/70"
                    }`}
                  >
                    {msg.sender === "assistant" ? "Assistant" : "You"} -{" "}
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isAssistantTyping ? (
            <div className="flex justify-start">
              <div className="flex max-w-[88%] items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#438ed8]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div
                  className="rounded-2xl border border-[#d5e1ec] bg-white px-4 py-3"
                  role="status"
                  aria-live="polite"
                  aria-label="Assistant is typing"
                >
                  <div className="flex h-5 items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d5e1ec] bg-white p-4">
        <div className="w-full">
          <div className="mb-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() =>
                sendMessage("Which dishes are safe for my allergens?")
              }
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-3 py-2 text-sm"
              disabled={!sessionToken || isAssistantTyping}
            >
              <Shield className="h-4 w-4 text-[#142653]" />
              Ask about allergens
            </button>
            <button
              onClick={() => sendMessage("Can I get water for the table?")}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-3 py-2 text-sm"
              disabled={!sessionToken || isAssistantTyping}
            >
              <Droplet className="h-4 w-4 text-[#142653]" />
              Ask for water
            </button>
          </div>

          <form
            className="flex items-center gap-3"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask anything..."
              className="min-w-0 flex-1 rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-4 py-3 text-sm focus:border-[#438ed8] focus:outline-none"
            />
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#142653] disabled:bg-gray-300"
              disabled={!message.trim() || !sessionToken || isAssistantTyping}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      </div>

      <CustomerBottomNav
        activeTab="chat"
        basePath={basePath}
        cartCount={cartCount > 0 ? cartCount : undefined}
        orderCount={1}
      />
    </CustomerMobileLayout>
  );
}
