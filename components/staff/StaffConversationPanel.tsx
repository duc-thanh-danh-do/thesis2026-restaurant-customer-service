"use client";

<<<<<<< HEAD
import { Bot, CheckCircle2, CircleDollarSign, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffReplyBox from "@/components/staff/StaffReplyBox";
import type { StaffSessionDetail } from "@/lib/staff-page-data";

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

type StaffConversationPanelProps =
  | { session: StaffSessionDetail; tableId?: never }
  | { tableId: string | null; session?: never };

function timeLabel(value: Date | string | null) {
  if (!value) return "unknown time";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isGuest(senderType: string) {
  return /customer|guest|user/i.test(senderType);
}

export default function StaffConversationPanel(props: StaffConversationPanelProps) {
  if (props.session) {
    return <SessionConversationPanel session={props.session} />;
  }

  return <DashboardConversationPanel tableId={props.tableId} />;
}

function DashboardConversationPanel({ tableId }: { tableId: string | null }) {
  const handleSendMessage = (text: string) => {
=======
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
>>>>>>> 16b1d17 (feat:fetch chatMessage fro db)
    console.log(`Sending message to table ${tableId}: ${text}`);
  };
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800">Table {tableId}</h2>
          </div>
          <Button className="w-full bg-green-500 text-white hover:bg-green-600 sm:w-auto">
            Mark all resolved
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <ScrollArea className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {mockMessages.map((msg) => (
            <div
              className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              key={msg.id}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${
                  msg.sender === "user" ? "bg-slate-700" : "bg-blue-400"
                }`}
              >
                {msg.avatar}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                  msg.sender === "user" ? "bg-slate-700 text-white" : "border border-slate-200 bg-white"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="mt-1 text-xs text-slate-400">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
=======
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
>>>>>>> 16b1d17 (feat:fetch chatMessage fro db)
      </ScrollArea>

      <StaffReplyBox onSendMessage={handleSendMessage} />
    </div>
  );
}

function SessionConversationPanel({ session }: { session: StaffSessionDetail }) {
  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-0 flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{session.restaurantName}</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Table {session.tableNumber}</h2>
              <p className="text-sm text-slate-500">Session #{session.id} - {session.status.replaceAll("_", " ")}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {session.handoverCount > 0 ? "Needs staff" : "AI handling"}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-5 py-5">
          {session.messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No chat messages have been recorded for this table yet.
            </div>
          ) : (
            session.messages.map((message) => {
              const guest = isGuest(message.senderType);
              const Icon = guest ? UserRound : Bot;
              return (
                <article className={`flex gap-3 ${guest ? "justify-end" : "justify-start"}`} key={message.id}>
                  {!guest ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div className={`max-w-[min(560px,80%)] ${guest ? "text-right" : ""}`}>
                    <p className="mb-1 text-xs text-slate-500">
                      {guest ? "Guest" : "Assistant"} - {timeLabel(message.createdAt)}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        guest ? "bg-[#142653] text-white" : "border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {message.messageContent}
                    </div>
                  </div>
                  {guest ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#142653] text-white">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        <StaffReplyBox />
      </section>

      <aside className="border-t border-slate-200 bg-[#f2f7fb] p-5 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-950">Orders</h3>
          <span className="text-sm font-semibold text-slate-500">{session.orders.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {session.orders.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">No orders yet.</p>
          ) : (
            session.orders.map((order) => (
              <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" key={order.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">#{order.id}</p>
                  <p className="font-semibold text-slate-950">EUR {order.total.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase text-blue-600">{order.status}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {order.items.map((item) => (
                    <div className="flex justify-between gap-3" key={item.id}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>EUR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h3 className="font-semibold text-slate-950">Service requests</h3>
          <span className="text-sm font-semibold text-slate-500">{session.requests.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {session.requests.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              No open service requests.
            </p>
          ) : (
            session.requests.map((request) => (
              <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" key={request.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{request.requestType}</p>
                    <p className="text-sm text-slate-500">{request.description ?? "No description"}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                    {request.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="inline-flex h-7 items-center gap-1 rounded-full bg-[#142653] px-3 text-xs font-semibold text-white" type="button">
                    <CircleDollarSign className="size-3" aria-hidden="true" />
                    Waiting
                  </button>
                  <button className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700" type="button">
                    <Send className="size-3" aria-hidden="true" />
                    In progress
                  </button>
                  <button className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-800" type="button">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Resolved
                  </button>
                </div>
              </section>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
