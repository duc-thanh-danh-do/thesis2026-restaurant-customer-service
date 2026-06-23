"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import RequestCard from "@/components/staff/RequestCard";
import OrderCard from "@/components/staff/OrderCard";
import { getTestOrder } from "@/actions/customer-order.action";
import { getTableRequestsAction } from "@/actions/customer-request.action";
import { AlertTriangle, ChevronRight, Utensils, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data matching description
const mockTables = [
  {
    id: "4",
    name: "Table 4",
    preview: "Assistant: Your request has been sent to the staff.",
    time: "2 min ago",
    hasWarning: true,
    badges: [
      { text: "Waiting", color: "bg-amber-500" },
      { text: "#A1 · Preparing", color: "bg-slate-600" },
    ],
    selected: false,
  },
  {
    id: "7",
    name: "Table 7",
    preview: "I've forwarded this to a staff member to…",
    time: "5 min ago",
    hasWarning: true,
    badges: [
      { text: "In progress", color: "bg-slate-600" },
      { text: "#A2 · Ready", color: "bg-blue-500" },
    ],
    selected: false,
  },
  {
    id: "12",
    name: "Table 12",
    preview: "Staff: On the way!",
    time: "10 min ago",
    hasWarning: false,
    badges: [{ text: "Resolved", color: "bg-green-500" }],
    selected: false,
  },
  {
    id: "2",
    name: "Table 2",
    preview: "Assistant: Welcome to Bistro Aurora, table 2.",
    time: "23 min ago",
    hasWarning: false,
    badges: [],
    selected: false,
  },
];

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

function TableList({
  tables,
  onSelectTable,
}: {
  tables: typeof mockTables;
  onSelectTable: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {tables.map((table) => (
        <div
          key={table.id}
          onClick={() => {
            setSelectedId(table.id);
            onSelectTable(table.id);
          }}
          className={`
            cursor-pointer rounded-lg p-4 transition-all duration-200
            ${selectedId === table.id ? "bg-white/10" : "hover:bg-white/5"}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {table.hasWarning && (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              <span className="font-semibold text-white">{table.name}</span>
            </div>
            <span className="text-xs text-slate-400">{table.time}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300 line-clamp-2">
            {table.preview}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {table.badges.map((badge, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full text-white ${badge.color}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Utensils className="h-10 w-10 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">Select a table</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Pick a table from the list to view the conversation and handle pending
        requests.
      </p>
    </div>
  );
}

function ChatPanel({ tableId }: { tableId: string | null }) {
  const [message, setMessage] = useState("");

  if (!tableId) {
    return (
      <div className="flex min-h-[360px] h-full items-center justify-center rounded-xl bg-slate-50">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex min-h-[520px] h-full flex-col overflow-hidden rounded-xl bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Bistro Aurora
            </p>
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0
                ${msg.sender === "user" ? "bg-slate-700" : "bg-blue-400"}`}
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
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "user" ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Reply Bar */}
      <div className="bg-white px-4 py-3 border-t border-slate-100">
        <div className="flex gap-2">
          <Input
            placeholder="Reply to the guest..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-slate-50 border-slate-200"
          />
          <Button
            size="icon"
            className="bg-slate-200 hover:bg-slate-300 text-slate-600"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailsPanel({ tableId }: { tableId: string | null }) {
  const [realOrder, setRealOrder] = useState<any>(null);
  const [realRequests, setRealRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!tableId) return;

    // get orders
    getTestOrder().then((data) => {
      if (data) {
        setRealOrder(data as any);
      }
    });

    getTableRequestsAction(tableId).then((data) => {
      setRealRequests(data);
    });
  }, [tableId]);
  if (!tableId) {
    return (
      <div className="flex min-h-[320px] h-full items-center justify-center rounded-xl bg-slate-50">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-xl bg-slate-50 p-4">
      <div className="space-y-4">
        {/* Orders */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
            Orders
          </h3>
          {realOrder ? (
            <OrderCard
              id={realOrder.id}
              time={realOrder.time}
              initialStatus={realOrder.status}
              items={realOrder.items}
            />
          ) : (
            <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">
              Loading order data...
            </div>
          )}
        </div>

        {/* Service requests  */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
            Service requests
          </h3>
          <div className="space-y-3">
            {realRequests.length === 0 ? (
              <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                No active requests for Table {tableId}
              </div>
            ) : (
              realRequests.map((req) => {
                const reqType = req.requestType.replace("_", " ");
                const timeStr = req.createdAt
                  ? new Date(req.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now";

                return (
                  <RequestCard
                    key={req.id}
                    id={req.id}
                    text={reqType}
                    time={timeStr}
                    initialStatus={req.status}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  const [selectedTableId, setSelectedTableId] = useState<string | null>("4");

  return (
    <div className="flex min-h-[calc(100dvh-73px)] flex-col bg-slate-100 xl:flex-row">
      {/* Sidebar - Dark Navy */}
      <div className="flex max-h-[420px] w-full flex-col bg-[#13275a] xl:max-h-none xl:w-[360px]">
        <div className="p-5">
          <p className="text-xs font-medium text-blue-300 uppercase tracking-wide">
            Staff Dashboard
          </p>
          <h1 className="text-xl font-bold text-white mt-1">Bistro Aurora</h1>
          <p className="text-sm text-blue-200 mt-1">
            2 need attention · 2 open orders
          </p>
        </div>

        <Button
          variant="outline"
          className="mx-5 mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Menu admin
        </Button>

        <ScrollArea className="min-h-0 flex-1 px-5 pb-5">
          <TableList tables={mockTables} onSelectTable={setSelectedTableId} />
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Chat Panel */}
        <div className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
          <ChatPanel tableId={selectedTableId} />
        </div>

        {/* Details Panel */}
        <div className="w-full overflow-hidden p-3 pt-0 sm:p-4 sm:pt-0 lg:w-[340px] lg:pt-4">
          <DetailsPanel tableId={selectedTableId} />
        </div>
      </div>
    </div>
  );
}
