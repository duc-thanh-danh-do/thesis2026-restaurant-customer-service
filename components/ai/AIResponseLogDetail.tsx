import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Database,
  FileText,
  type LucideIcon,
  MessageSquare,
  Search,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  getStaffAiLogDetail,
  type StaffAiRetrievedKnowledge,
} from "@/lib/staff-page-data";

function dateLabel(value: Date | null) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatScore(value: number) {
  if (!Number.isFinite(value)) return "0.000";
  return value.toFixed(3);
}

export default async function AIResponseLogDetail({
  logId,
  restaurantId,
}: {
  logId: string;
  restaurantId: number;
}) {
  const parsedLogId = Number(logId);
  if (!Number.isInteger(parsedLogId)) notFound();

  const log = await getStaffAiLogDetail(parsedLogId, restaurantId);
  if (!log) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link
            href="/ai-logs"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[#142653]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            AI logs
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
            AI response log
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Table {log.tableNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {log.modelName} - {dateLabel(log.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Metric label="Manual KB" value={log.retrievedManualCount} />
          <Metric label="Doc Chunks" value={log.retrievedDocumentChunkCount} />
          <RetrievalModeBadge mode={log.documentRetrievalMode} />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              log.handoverRequired
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {log.handoverRequired ? (
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Bot className="h-4 w-4" aria-hidden="true" />
            )}
            {log.handoverRequired ? "Handover" : "AI handled"}
          </span>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customer Message" icon={MessageSquare}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {log.customerMessage}
          </p>
        </Panel>
        <Panel title="AI Response" icon={Bot}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {log.aiMessage || log.response}
          </p>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Manual Knowledge Matches" icon={Database}>
          {log.retrievedKnowledge.manualEntries.length === 0 ? (
            <EmptyText>No manual knowledge entries were retrieved.</EmptyText>
          ) : (
            <div className="space-y-3">
              {log.retrievedKnowledge.manualEntries.map((entry) => (
                <EvidenceItem
                  key={entry.id}
                  title={entry.title}
                  meta={`Category: ${entry.category ?? "Not available"} - Score: ${formatScore(entry.score)}`}
                  content={entry.content}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Document Chunk Matches" icon={FileText}>
          <div className="mb-3">
            <RetrievalModeBadge mode={log.documentRetrievalMode} />
          </div>
          {log.retrievedKnowledge.documentChunks.length === 0 ? (
            <EmptyText>No uploaded document chunks were retrieved.</EmptyText>
          ) : (
            <div className="space-y-3">
              {log.retrievedKnowledge.documentChunks.map((chunk) => (
                <EvidenceItem
                  key={chunk.id}
                  title={`${chunk.documentTitle} (chunk ${chunk.chunkIndex + 1})`}
                  meta={`Document #${chunk.documentId} - ${chunk.scoreLabel || formatScore(chunk.score)}`}
                  content={chunk.content}
                />
              ))}
            </div>
          )}
        </Panel>
      </section>

      <Panel title="Handover Decision" icon={ShieldAlert}>
        {log.handoverRequired ? (
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <Detail label="Rule" value={log.handoverRuleName ?? "Default rule"} />
            <Detail
              label="Category"
              value={log.handoverRuleCategory ?? "Not available"}
            />
            <Detail
              label="Request type"
              value={log.handoverRequestType ?? "Not available"}
            />
            <div className="md:col-span-3">
              <Detail
                label="Reason"
                value={log.handoverReason ?? "No reason stored."}
              />
            </div>
          </div>
        ) : (
          <EmptyText>No staff handover was required.</EmptyText>
        )}
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Retrieved Context Sent To AI" icon={Database}>
          <PreformattedText value={log.retrievedContext} />
        </Panel>
        <Panel title="Full Prompt" icon={FileText}>
          <PreformattedText value={log.prompt} />
        </Panel>
      </section>
    </div>
  );
}

function RetrievalModeBadge({
  mode,
}: {
  mode: StaffAiRetrievedKnowledge["documentRetrievalMode"];
}) {
  const label =
    mode === "vector"
      ? "Vector retrieval"
      : mode === "keyword"
        ? "Keyword retrieval"
        : "No document matches";
  const className =
    mode === "vector"
      ? "bg-blue-50 text-blue-700"
      : mode === "keyword"
        ? "bg-slate-100 text-slate-600"
        : "bg-gray-50 text-gray-500";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${className}`}
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
      {label}: {value}
    </span>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#142653]" aria-hidden="true" />
        <h2 className="font-semibold text-[#142653]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function EvidenceItem({
  title,
  meta,
  content,
}: {
  title: string;
  meta: string;
  content: string;
}) {
  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs font-medium text-slate-500">{meta}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {content}
      </p>
    </article>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

function PreformattedText({ value }: { value: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
      {value}
    </pre>
  );
}
