"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import CustomerChatInput from "@/components/customer/CustomerChatInput";
import ChatMessageBubble from "@/components/customer/ChatMessageBubble";
import type { UiChatMessage } from "@/types/chat-message";

export default function CustomerChat({ sessionToken }: { sessionToken: string }) {
  const [messages, setMessages] = useState<UiChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      content:
        "Hi. I can help with the TestPizza menu, ingredients, allergens, opening hours, and payment information.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = input.trim();

    if (!trimmedMessage || isSending) return;

    setMessages((current) => [
      ...current,
      { id: `customer-${Date.now()}`, sender: "customer", content: trimmedMessage },
    ]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, message: trimmedMessage }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Failed to send message");
      }

      const payload = (await response.json()) as {
        reply: string;
        aiMessage: { id: number };
      };

      setMessages((current) => [
        ...current,
        { id: `ai-${payload.aiMessage.id}`, sender: "ai", content: payload.reply },
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Failed to send message");
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          sender: "system",
          content:
            "The assistant could not answer right now. Please try again or ask restaurant staff for help.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4.5rem)] flex-col px-4 py-6">
      <header className="mb-4">
        <p className="text-sm font-medium text-neutral-500">TestPizza</p>
        <h1 className="mt-1 text-2xl font-bold">AI Assistant</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Ask about menu items, ingredients, allergens, opening hours, or payment options.
        </p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="flex-1 space-y-3 pb-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {isSending ? (
          <ChatMessageBubble
            message={{ id: "typing", sender: "ai", content: "Assistant is typing..." }}
          />
        ) : null}
        <div ref={bottomRef} />
      </section>

      <CustomerChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isSending}
      />
    </main>
  );
}
