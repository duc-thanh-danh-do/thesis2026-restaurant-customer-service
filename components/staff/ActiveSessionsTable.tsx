import Link from "next/link";
import { AlertTriangle, Bot, ClipboardList, MessageCircle, Utensils } from "lucide-react";
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

export default function ActiveSessionsTable({ sessions }: { sessions: StaffSessionSummary[] }) {
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
    <section className="surface overflow-hidden">
      <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_0.7fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 max-lg:hidden">
        <span>Table</span>
        <span>Status</span>
        <span>Requests</span>
        <span>Orders</span>
        <span>Started</span>
      </div>
      <div className="divide-y divide-slate-100">
        {sessions.map((session) => (
          <Link
            className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_0.7fr] lg:items-center"
            href={`/sessions/${session.id}`}
            key={session.id}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-950">Table {session.tableNumber}</span>
                {session.handoverCount > 0 ? (
                  <AlertTriangle className="size-4 text-amber-500" aria-label="Needs attention" />
                ) : null}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{session.lastMessage}</p>
            </div>
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(session.status)}`}>
                {session.status.replaceAll("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ClipboardList className="size-4 text-slate-400" aria-hidden="true" />
              {session.requestCount}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Utensils className="size-4 text-slate-400" aria-hidden="true" />
              {session.orderCount}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bot className="size-4 text-slate-400" aria-hidden="true" />
              {relativeTime(session.startedAt)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
