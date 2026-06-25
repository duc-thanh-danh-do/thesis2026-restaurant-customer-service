"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffReplyBox from "@/components/staff/StaffReplyBox";
import { formatRelativeTime } from "@/lib/utils";
import { getTableMessagesAction } from "@/actions/chat.action";

export default function StaffConversationPanel({
  tableId,
}: {
  tableId: string | null;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!tableId) return;
    setIsLoading(true);
    try {
      const data = await getTableMessagesAction(tableId);
      setMessages(data || []);

      console.log(`Fetching messages for table ${tableId}...`);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = async (text: string) => {
    console.log(`Sending message to table ${tableId}: ${text}`);
  };
  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6 flex-shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800">
              Table {tableId}
            </h2>
          </div>
          <Button className="w-full bg-green-500 text-white hover:bg-green-600 sm:w-auto">
            Mark all resolved
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 overflow-y-auto p-4 min-h-0">
        {isLoading ? (
          <div className="flex justify-center p-8 text-sm text-slate-400">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center p-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl mt-4">
            No active conversation for this table yet.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser =
                msg.senderType === "customer" ||
                msg.role === "customer" ||
                msg.sender === "customer";

              const textContent = msg.messageContent || msg.content || msg.text;

              const avatarText = isUser ? "TR" : "AI";

              const timeStr = msg.createdAt
                ? formatRelativeTime(msg.createdAt)
                : "Just now";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 ${
                      isUser ? "bg-slate-700" : "bg-blue-400"
                    }`}
                  >
                    {avatarText}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                      isUser
                        ? "bg-slate-700 text-white"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                    <p className="text-xs mt-1 text-slate-400/80">{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <StaffReplyBox onSendMessage={handleSendMessage} />
    </div>
  );
}
