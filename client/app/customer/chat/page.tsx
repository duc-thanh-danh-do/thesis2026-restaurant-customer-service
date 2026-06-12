"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createCustomerSession } from "../../../lib/api/customerSessionApi";
import { sendChatMessage } from "../../../lib/api/chatApi";
import type { UiChatMessage } from "../../../types/chat";
import ChatInput from "../../../components/customer/ChatInput";

const TEMP_QR_CODE_TOKEN = "testpizza-table-1";
const SESSION_STORAGE_KEY = "testpizza-session-token";

export default function CustomerChatPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      content:
        "Hi! I can help you with the TestPizza menu, ingredients, allergens, opening hours, and payment information.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStartingSession, setIsStartingSession] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function startSession() {
      try {
        setError(null);

        const existingToken = window.localStorage.getItem(SESSION_STORAGE_KEY);

        if (existingToken) {
          setSessionToken(existingToken);
          return;
        }

        const sessionResponse = await createCustomerSession(TEMP_QR_CODE_TOKEN);

        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          sessionResponse.sessionToken,
        );

        setSessionToken(sessionResponse.sessionToken);
      } catch (sessionError) {
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Failed to start customer session",
        );
      } finally {
        setIsStartingSession(false);
      }
    }

    startSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || !sessionToken || isSending) {
      return;
    }

    const customerMessage: UiChatMessage = {
      id: `customer-${Date.now()}`,
      sender: "customer",
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, customerMessage]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await sendChatMessage(sessionToken, trimmedMessage);

      const aiMessage: UiChatMessage = {
        id: `ai-${response.aiMessage.id}`,
        sender: "ai",
        content: response.reply,
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);
    } catch (chatError) {
      setError(
        chatError instanceof Error
          ? chatError.message
          : "Failed to send message",
      );

      setMessages((currentMessages) => [
        ...currentMessages,
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
    <main className="flex min-h-[calc(100vh-6rem)] flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 sm:max-w-lg sm:px-6">
        <header className="mb-4">
          <p className="text-sm font-medium text-neutral-500">TestPizza</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
            AI Assistant
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Ask us about menu items, ingredients, allergens, opening hours, or
            payment options.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="flex-1 space-y-3 pb-4">
          {messages.map((message) => {
            const isCustomer = message.sender === "customer";
            const isSystem = message.sender === "system";

            return (
              <div
                key={message.id}
                className={`flex ${
                  isCustomer ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    isCustomer
                      ? "bg-neutral-950 text-white"
                      : isSystem
                        ? "border border-amber-100 bg-amber-50 text-amber-800"
                        : "border border-neutral-200 bg-white text-neutral-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
                Assistant is typing...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isStartingSession={isStartingSession}
        isSending={isSending}
        isDisabled={isStartingSession || isSending || !sessionToken}
        />
      </div>
    </main>
  );
}
