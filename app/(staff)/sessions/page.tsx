import ActiveSessionsTable from "@/components/staff/ActiveSessionsTable";
import { getStaffSessions } from "@/lib/staff-page-data";

export const dynamic = "force-dynamic";

export default async function StaffSessionsPage() {
  const sessions = await getStaffSessions();
  const openSessions = sessions.filter((session) => session.status !== "closed").length;
  const handovers = sessions.reduce((total, session) => total + session.handoverCount, 0);
  const requests = sessions.reduce((total, session) => total + session.requestCount, 0);

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Restaurant operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Customer sessions</h1>
          <p className="mt-1 text-slate-600">
            Monitor table conversations, AI handovers, service requests, and open orders.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Open" value={openSessions} />
          <Metric label="Needs staff" value={handovers} />
          <Metric label="Requests" value={requests} />
        </div>
      </div>
      <ActiveSessionsTable sessions={sessions} />
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
