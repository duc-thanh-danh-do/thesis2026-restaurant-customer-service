import { AlertTriangle, Bot, HandHelping, MessageSquareText, RotateCcw, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MetricCard, StatusPill } from "@/components/admin/AdminPrimitives";
import { requireAdminUser } from "@/lib/auth";
import { getAdminMonitoringData } from "@/services/admin-dashboard.service";
import { RollbackInstructionButton } from "@/components/admin/InstructionWorkflowButtons";

export default async function MonitoringPage() {
  const user = await requireAdminUser();
  const data = await getAdminMonitoringData(user.restaurantId);
  const published = data.versions.find((version) => version.status === "PUBLISHED");
  const rollbackTarget = data.versions.find((version) => version.status === "ARCHIVED");
  const safeRate = data.responsesToday === 0 ? 100 : Math.round(((data.responsesToday - data.handoversToday) / data.responsesToday) * 1000) / 10;

  return (
    <>
      <AdminPageHeader eyebrow="Insights" title="AI monitoring and rollback" description="Review real response logs, handovers, instruction-version usage, and privileged audit events." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Responses today" value={data.responsesToday} detail="Stored AI response logs" icon={<MessageSquareText className="size-5" />} />
        <MetricCard label="Handovers" value={data.handoversToday} detail="Escalated to restaurant staff" icon={<HandHelping className="size-5" />} tone="violet" />
        <MetricCard label="Flagged outputs" value={data.flaggedOutputs} detail="Recent logs requiring review" icon={<AlertTriangle className="size-5" />} tone="amber" />
        <MetricCard label="Resolved without handover" value={`${safeRate}%`} detail="Today’s automated response rate" icon={<ShieldCheck className="size-5" />} tone="green" />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="grid-cols-[0.55fr_0.8fr_1.5fr_0.8fr_0.6fr] gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Log</span><span>Time</span><span>Response summary</span><span>Result</span><span>Version</span></div>
        <div className="divide-y divide-slate-100">{data.logs.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No AI response logs yet.</p> : data.logs.map((log) => <div key={log.id} className="grid gap-3 px-5 py-5 md:grid-cols-[0.55fr_0.8fr_1.5fr_0.8fr_0.6fr] md:items-center"><p className="flex items-center gap-2 text-sm font-semibold text-[#438ed8]"><Bot className="size-4" />AI-{log.id}</p><p className="text-sm text-slate-500">{log.createdAt?.toLocaleString() ?? "Unknown"}</p><p className="line-clamp-2 text-sm text-slate-600">{log.response || "No response recorded"}</p><StatusPill tone={log.handoverRequired ? "warning" : "success"}>{log.handoverRequired ? "Handed over" : "Answered"}</StatusPill><p className="text-sm text-slate-500">{log.instructionVersion ? `v${log.instructionVersion.version}` : "Default"}</p></div>)}</div>
      </div>
      <section className="mt-6 rounded-xl bg-[#142653] p-5 text-white shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-300"><RotateCcw className="size-5" /></span><div><h2 className="font-semibold">Rollback control</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Current: {published ? `v${published.version}` : "no published version"}. Restoring an archived version is transactional and creates an audit record.</p></div></div>
        {rollbackTarget ? <RollbackInstructionButton targetId={rollbackTarget.id} version={rollbackTarget.version} /> : <p className="mt-4 text-sm text-slate-300 sm:mt-0">No rollback target yet</p>}
      </section>
      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"><h2 className="font-semibold text-[#142653]">Recent audit history</h2><div className="mt-4 divide-y divide-slate-100">{data.auditLogs.length === 0 ? <p className="py-4 text-sm text-slate-500">No administrative audit events yet.</p> : data.auditLogs.map((log) => <div className="flex items-center justify-between gap-4 py-3 text-sm" key={log.id}><span className="font-medium text-slate-700">{log.action.replaceAll("_", " ")}</span><span className="text-slate-400">{log.createdAt.toLocaleString()}</span></div>)}</div></section>
    </>
  );
}
