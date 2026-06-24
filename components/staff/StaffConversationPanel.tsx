"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffReplyBox from "@/components/staff/StaffReplyBox";

const mockMessages = [
  {
    id: 1,
    sender: "assistant",
    text: "Welcome to Bistro Aurora, table 4. How can I help you today?",
    time: "23 min ago",
    avatar: "AI",
  },
  {
    id: 2,
    sender: "user",
    text: "Which dishes are vegetarian and do not contain sesame?",
    time: "22 min ago",
    avatar: "TR",
  },
  {
    id: 3,
    sender: "assistant",
    text: "Three dishes match: Wild Mushroom Risotto, Roasted Beet Salad, and Tomato Orecchiette. None contain sesame.",
    time: "21 min ago",
    avatar: "AI",
  },
  {
    id: 4,
    sender: "user",
    text: "Can I have the bill, please?",
    time: "3 min ago",
    avatar: "TR",
  },
  {
    id: 5,
    sender: "assistant",
    text: "Your request has been sent to the staff.",
    time: "3 min ago",
    avatar: "AI",
  },
];

export default function StaffConversationPanel({
  tableId,
}: {
  tableId: string | null;
}) {
  const handleSendMessage = (text: string) => {
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
        <div className="space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 ${
                  msg.sender === "user" ? "bg-slate-700" : "bg-blue-400"
                }`}
              >
                {msg.avatar}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                  msg.sender === "user"
                    ? "bg-slate-700 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs mt-1 text-slate-400">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <StaffReplyBox onSendMessage={handleSendMessage} />
    </div>
  );
}
