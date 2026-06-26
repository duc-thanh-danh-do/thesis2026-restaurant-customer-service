"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, UserRound } from "lucide-react";
import { getActiveStaffSessionForTableAction } from "@/actions/staff-session.action";
import { sendStaffMessageAction } from "@/actions/staff-message.action";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffReplyBox from "@/components/staff/StaffReplyBox";
import type { StaffSessionDetail } from "@/lib/staff-page-data";

function isGuest(senderType: string) {
  return /customer|guest|user/i.test(senderType);
}

function timeLabel(value: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DashboardConversationPanel({ tableId }: { tableId: string | null }) {
  const [session, setSession] = useState<StaffSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSession = useCallback(async () => {
    if (!tableId) {
      setSession(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getActiveStaffSessionForTableAction(tableId);

    if (!result.success) {
      setError(result.error ?? "Unable to load table conversation.");
      setSession(null);
    } else {
      setSession(result.session);
    }

    setIsLoading(false);
  }, [tableId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();
  }, [loadSession]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800">Table {tableId ?? "-"}</h2>
          <p className="text-sm text-slate-500">
            {session ? `Session #${session.id} - ${session.status.replaceAll("_", " ")}` : "No active session selected"}
          </p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Loading conversation...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        ) : !session ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No active conversation for this table.
          </div>
        ) : (
          <div className="space-y-4">
            {session.messages.map((message) => {
              const guest = isGuest(message.senderType);
              const Icon = guest ? UserRound : Bot;

              return (
                <div
                  className={`flex gap-3 ${guest ? "flex-row-reverse" : ""}`}
                  key={message.id}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${
                      guest ? "bg-slate-700" : "bg-blue-400"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                      guest ? "bg-slate-700 text-white" : "border border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-sm">{message.messageContent}</p>
                    <p className={`mt-1 text-xs ${guest ? "text-white/70" : "text-slate-400"}`}>
                      {timeLabel(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <StaffReplyBox
        onSendMessage={async (text) => {
          if (!session) return { success: false, error: "No active session selected." };
          const result = await sendStaffMessageAction(session.id, text);
          if (result.success) await loadSession();
          return result;
        }}
      />
    </div>
  );
}
