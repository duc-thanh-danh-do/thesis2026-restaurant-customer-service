import Link from "next/link";
import { ArrowRight, Bot, FileText, ShieldAlert } from "lucide-react";
import type { StaffAiLogSummary } from "@/lib/staff-page-data";

function shortText(value: string) {
  return value.length > 140 ? `${value.slice(0, 137)}...` : value;
}

function dateLabel(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default function AIResponseLogTable({ logs }: { logs: StaffAiLogSummary[] }) {
  if (logs.length === 0) {
    return (
      <section className="surface flex min-h-64 items-center justify-center p-8 text-center">
        <div>
          <Bot className="mx-auto size-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">No AI logs yet</h2>
          <p className="mt-1 text-sm text-slate-500">Responses will appear after customer chat uses the AI assistant.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="surface overflow-hidden">
      <div className="grid grid-cols-[0.6fr_0.7fr_1.3fr_1.2fr_0.8fr_0.7fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 max-xl:hidden">
        <span>Table</span>
        <span>Model</span>
        <span>Prompt</span>
        <span>Response</span>
        <span>Evidence</span>
        <span>Created</span>
      </div>
      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <Link
            className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 xl:grid-cols-[0.6fr_0.7fr_1.3fr_1.2fr_0.8fr_0.7fr] xl:items-start"
            href={`/ai-logs/${log.id}`}
            key={log.id}
          >
            <div className="font-semibold text-slate-950">Table {log.tableNumber}</div>
            <div className="text-sm text-slate-600">{log.modelName}</div>
            <div className="text-sm leading-6 text-slate-700">{shortText(log.prompt)}</div>
            <div className="text-sm leading-6 text-slate-700">{shortText(log.response)}</div>
            <div className="flex flex-wrap gap-1.5">
              <EvidenceBadge label="KB" value={log.retrievedManualCount} />
              <EvidenceBadge label="Docs" value={log.retrievedDocumentChunkCount} />
              {log.handoverRuleName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  Rule
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
              <span>{dateLabel(log.createdAt)}</span>
              {log.handoverRequired ? (
                <ShieldAlert className="size-4 shrink-0 text-amber-500" aria-label="Handover required" />
              ) : (
                <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EvidenceBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <FileText className="size-3" aria-hidden="true" />
      {label} {value}
    </span>
  );
}
