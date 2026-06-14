import type { UiChatMessage } from "@/types/chat-message";

export default function ChatMessageBubble({ message }: { message: UiChatMessage }) {
  const isCustomer = message.sender === "customer";
  const isSystem = message.sender === "system";

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
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
}
