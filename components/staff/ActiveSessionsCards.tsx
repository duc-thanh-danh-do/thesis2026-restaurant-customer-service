"use client";

import Link from "next/link";
import { AlertTriangle, Clock, ClipboardList, MessageCircle, Utensils } from "lucide-react";
import type { StaffSessionSummary } from "@/lib/staff-page-data";

function statusTone(status: string) {
  if (/waiting|handover|staff/i.test(status)) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (/closed|resolved/i.test(status)) return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  return "bg-blue-100 text-blue-800 ring-blue-200";
}

function relativeTime(value: Date | null) {
  if (!value) return "No activity";
  const minutes = Math.max(1, Math.round((Date.now() - value.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

export default function ActiveSessionsCards({ sessions }: { sessions: StaffSessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <section className="surface flex min-h-64 items-center justify-center p-8 text-center">
        <div>
          <MessageCircle className="mx-auto size-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">No active sessions</h2>
          <p className="mt-1 text-sm text-slate-500">Guest conversations will appear here after QR entry.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/sessions/${session.id}`}
          className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950">Table {session.tableNumber}</h3>
              {session.handoverCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <AlertTriangle className="size-3" />
                  Needs attention
                </span>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(session.status)}`}>
              {session.status.replaceAll("_", " ")}
            </span>
          </div>

          {/* Last message */}
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {session.lastMessage || "No conversation yet."}
          </p>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="size-3.5 text-slate-400" />
              {session.requestCount} requests
            </span>
            <span className="inline-flex items-center gap-1">
              <Utensils className="size-3.5 text-slate-400" />
              {session.orderCount} orders
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-slate-400" />
              {relativeTime(session.startedAt)}
            </span>
          </div>

          {/* View detail hint */}
          <div className="mt-3 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
            View details →
          </div>
        </Link>
      ))}
    </div>
  );
}
