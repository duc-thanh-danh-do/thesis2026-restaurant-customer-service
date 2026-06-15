"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Droplet, Send, Shield } from "lucide-react";
import {
  CustomerBottomNav,
  CustomerMobileHeader,
  CustomerMobileLayout,
} from "@/components/layout/CustomerMobileLayout";
import { MOCK_CHAT_MESSAGES } from "@/data/mock-data";

const cartStorageKey = "bistro-demo-cart";

function getInitialCartCount() {
  if (typeof window === "undefined") return 0;

  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (!savedCart) return 0;

  const cart = JSON.parse(savedCart) as Record<string, number>;
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

type Message = {
  id: string;
  sender: "assistant" | "user";
  content: string;
  timestamp: Date;
};

export default function ChatPage() {
  const params = useParams<{ qrToken: string }>();
  const basePath = `/table/${params.qrToken}`;
  const [message, setMessage] = useState("");
  const [cartCount] = useState(getInitialCartCount);
  const [messages, setMessages] = useState<Message[]>(
    MOCK_CHAT_MESSAGES.map((msg) => ({
      id: msg.id,
      sender: msg.sender === "assistant" ? "assistant" : "user",
      content: msg.content,
      timestamp: msg.timestamp,
    }))
  );

  const sendMessage = (content = message) => {
    const trimmedMessage = content.trim();
    if (!trimmedMessage) return;

    const now = new Date();
    setMessages((current) => [
      ...current,
      {
        id: `user-${now.getTime()}`,
        sender: "user",
        content: trimmedMessage,
        timestamp: now,
      },
      {
        id: `assistant-${now.getTime()}`,
        sender: "assistant",
        content:
          "I can help with that. A staff member can also see your request if it needs service at the table.",
        timestamp: now,
      },
    ]);
    setMessage("");
  };

  return (
    <CustomerMobileLayout>
      <CustomerMobileHeader
        title="Ask the assistant - Table 4"
        rightElement={
          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Service active
          </span>
        }
      />

      <div className="flex items-center justify-between gap-3 border-b border-[#d5e1ec] bg-white px-4 py-3">
        <div className="min-w-0">
          <span className="text-sm font-medium text-[#142653]">
            Request bill
          </span>
          <p className="text-xs text-gray-500">Sent 3 min ago</p>
        </div>
        <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          Waiting
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f5f9fc] px-4 py-4 pb-28">
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
        </div>
      </div>

      <div className="border-t border-[#d5e1ec] bg-white p-4">
        <div className="w-full">
          <div className="mb-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() =>
                sendMessage("Which dishes are safe for my allergens?")
              }
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-3 py-2 text-sm"
            >
              <Shield className="h-4 w-4 text-[#142653]" />
              Ask about allergens
            </button>
            <button
              onClick={() => sendMessage("Can I get water for the table?")}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-3 py-2 text-sm"
            >
              <Droplet className="h-4 w-4 text-[#142653]" />
              Ask for water
            </button>
          </div>

          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
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
              disabled={!message.trim()}
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
