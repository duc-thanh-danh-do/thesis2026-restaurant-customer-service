import AIResponseLogTable from "@/components/ai/AIResponseLogTable";
import { requireStaffUser } from "@/lib/auth";
import { getStaffAiLogs } from "@/lib/staff-page-data";

export const dynamic = "force-dynamic";

export default async function AiLogsPage() {
  const staffUser = await requireStaffUser();
  const logs = await getStaffAiLogs(staffUser.restaurantId);
  const handovers = logs.filter((log) => log.handoverRequired).length;
  const models = new Set(logs.map((log) => log.modelName)).size;

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">AI observability</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">AI response logs</h1>
          <p className="mt-1 text-slate-600">
            Audit prompts, retrieved context, responses, and staff handover decisions.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Logs" value={logs.length} />
          <Metric label="Handovers" value={handovers} />
          <Metric label="Models" value={models} />
        </div>
      </div>
      <AIResponseLogTable logs={logs} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right">
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
    </div>
  );
}
