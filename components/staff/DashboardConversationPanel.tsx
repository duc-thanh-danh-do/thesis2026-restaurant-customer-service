"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  Loader2,
  UserRound,
} from "lucide-react";
import { getActiveStaffSessionForTableAction } from "@/actions/staff-session.action";
import { sendStaffMessageAction } from "@/actions/staff-message.action";
import StaffReplyBox from "@/components/staff/StaffReplyBox";
import type { StaffSessionDetail } from "@/lib/staff-page-data";

const CONVERSATION_CACHE_KEY = "staff-dashboard-conversations";
const CONVERSATION_POLL_INTERVAL_MS = 3_000;

type DeliveryStatus = "sending" | "sent" | "read" | "failed";

type ConversationMessage = StaffSessionDetail["messages"][number] & {
  deliveryStatus?: DeliveryStatus;
};

type ConversationSession = Omit<StaffSessionDetail, "messages"> & {
  messages: ConversationMessage[];
};

type ConversationCache = Record<string, ConversationSession | null>;

function isGuest(senderType: string) {
  return /customer|guest|user/i.test(senderType);
}

function isStaff(senderType: string) {
  return /staff/i.test(senderType);
}

function timeLabel(value: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toConversationSession(
  session: StaffSessionDetail | null,
): ConversationSession | null {
  if (!session) return null;

  return {
    ...session,
    messages: session.messages.map((message) => ({
      ...message,
      deliveryStatus: isStaff(message.senderType) ? "read" : undefined,
    })),
  };
}

function readStoredConversationCache(): ConversationCache {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.sessionStorage.getItem(CONVERSATION_CACHE_KEY);
    return rawValue ? (JSON.parse(rawValue) as ConversationCache) : {};
  } catch {
    return {};
  }
}

function writeStoredConversationCache(cache: ConversationCache) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      CONVERSATION_CACHE_KEY,
      JSON.stringify(cache),
    );
  } catch {
    // Ignore storage quota/private-mode failures; the in-memory state still works.
  }
}

function mergeLoadedConversation(
  localSession: ConversationSession | null | undefined,
  loadedSession: StaffSessionDetail | null,
) {
  const nextSession = toConversationSession(loadedSession);
  if (!nextSession || !localSession) return nextSession;

  const loadedIds = new Set(nextSession.messages.map((message) => message.id));
  const localOnlyMessages = localSession.messages.filter((message) => {
    if (loadedIds.has(message.id)) return false;
    return (
      message.deliveryStatus === "sending" ||
      message.deliveryStatus === "sent" ||
      message.deliveryStatus === "failed"
    );
  });

  return {
    ...nextSession,
    messages: [...nextSession.messages, ...localOnlyMessages].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    }),
  };
}

function DeliveryIndicator({ status }: { status?: DeliveryStatus }) {
  if (!status) return null;

  const labelByStatus: Record<DeliveryStatus, string> = {
    sending: "Sending...",
    sent: "Sent",
    read: "Read",
    failed: "Failed",
  };

  const icon =
    status === "sending" ? (
      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
    ) : status === "read" ? (
      <CheckCheck className="size-3" aria-hidden="true" />
    ) : status === "failed" ? (
      <AlertCircle className="size-3" aria-hidden="true" />
    ) : (
      <Check className="size-3" aria-hidden="true" />
    );

  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {labelByStatus[status]}
    </span>
  );
}

export default function DashboardConversationPanel({
  tableId,
}: {
  tableId: string | null;
}) {
  const [sessionsByTable, setSessionsByTable] = useState<ConversationCache>(
    () => readStoredConversationCache(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sessionsByTableRef = useRef<ConversationCache>(sessionsByTable);

  const session = tableId ? sessionsByTable[tableId] : null;

  useEffect(() => {
    sessionsByTableRef.current = sessionsByTable;
    writeStoredConversationCache(sessionsByTable);
  }, [sessionsByTable]);

  const updateSessionCache = useCallback(
    (
      nextCache:
        | ConversationCache
        | ((previousCache: ConversationCache) => ConversationCache),
    ) => {
      setSessionsByTable((previousCache) => {
        const resolvedCache =
          typeof nextCache === "function"
            ? nextCache(previousCache)
            : nextCache;
        sessionsByTableRef.current = resolvedCache;
        return resolvedCache;
      });
    },
    [],
  );

  const loadSession = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!tableId) {
        return;
      }

      const currentCache = sessionsByTableRef.current;

      if (!silent && !Object.hasOwn(currentCache, tableId)) setIsLoading(true);
      setError(null);

      const result = await getActiveStaffSessionForTableAction(tableId);

      if (!result.success) {
        setError(result.error ?? "Unable to load table conversation.");
        if (!silent) {
          updateSessionCache((previousCache) => ({
            ...previousCache,
            [tableId]: null,
          }));
        }
      } else {
        updateSessionCache((previousCache) => ({
          ...previousCache,
          [tableId]: mergeLoadedConversation(
            previousCache[tableId],
            result.session,
          ),
        }));
      }

      setIsLoading(false);
    },
    [tableId, updateSessionCache],
  );

  useEffect(() => {
    if (!tableId) return;

    const hasCachedSession = Object.hasOwn(sessionsByTableRef.current, tableId);

    const refreshTimeoutId = window.setTimeout(() => {
      void loadSession({ silent: hasCachedSession });
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadSession({ silent: false });
    }, CONVERSATION_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(refreshTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadSession, tableId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, tableId]);

  const headerStatus = useMemo(() => {
    if (session)
      return `Session #${session.id} - ${session.status.replaceAll("_", " ")}`;
    if (isLoading) return "Loading latest conversation";
    return "No active session selected";
  }, [isLoading, session]);

  const handleSendMessage = async (text: string) => {
    if (!tableId || !session)
      return { success: false, error: "No active session selected." };

    const tempId = -Date.now();
    const optimisticMessage: ConversationMessage = {
      id: tempId,
      senderType: "staff",
      messageContent: text,
      createdAt: new Date(),
      deliveryStatus: "sending",
    };

    updateSessionCache((previousCache) => {
      const currentSession = previousCache[tableId] ?? session;

      if (!currentSession) {
        return previousCache;
      }

      return {
        ...previousCache,
        [tableId]: {
          ...currentSession,
          messages: [...currentSession.messages, optimisticMessage],
        },
      };
    });

    const result = await sendStaffMessageAction(session.id, text);

    if (!result.success) {
      updateSessionCache((previousCache) => {
        const currentSession = previousCache[tableId];

        if (!currentSession) {
          return previousCache;
        }

        return {
          ...previousCache,
          [tableId]: {
            ...currentSession,
            messages: currentSession.messages.map((message) =>
              message.id === tempId
                ? { ...message, deliveryStatus: "failed" as const }
                : message,
            ),
          },
        };
      });
      return result;
    }

    const confirmedMessage = result.message;
    updateSessionCache((previousCache) => {
      const currentSession = previousCache[tableId];

      if (!currentSession) {
        return previousCache;
      }

      return {
        ...previousCache,
        [tableId]: {
          ...currentSession,
          messages: currentSession.messages.map((message) =>
            message.id === tempId
              ? {
                  id: confirmedMessage?.id ?? tempId,
                  senderType: confirmedMessage?.senderType ?? "staff",
                  messageContent: confirmedMessage?.messageContent ?? text,
                  createdAt: confirmedMessage?.createdAt ?? message.createdAt,
                  deliveryStatus: "sent" as const,
                }
              : message,
          ),
        },
      };
    });

    window.setTimeout(() => {
      void loadSession({ silent: true });
    }, 600);

    return result;
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800">
            Table {tableId ?? "-"}
          </h2>
          <p className="text-sm text-slate-500">{headerStatus}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading && !session ? (
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
                      guest
                        ? "bg-slate-700 text-white"
                        : "border border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-sm">{message.messageContent}</p>
                    <p
                      className={`mt-1 flex items-center gap-2 text-xs ${guest ? "justify-end text-white/70" : "text-slate-400"}`}
                    >
                      <span>{timeLabel(message.createdAt)}</span>
                      {!guest ? (
                        <DeliveryIndicator status={message.deliveryStatus} />
                      ) : null}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <StaffReplyBox onSendMessage={handleSendMessage} />
    </div>
  );
}
