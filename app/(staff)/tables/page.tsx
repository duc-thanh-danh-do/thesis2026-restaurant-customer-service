import Link from "next/link";
import { Activity, ClipboardList, Plus, QrCode, type LucideIcon } from "lucide-react";
import { getStaffTables } from "@/lib/staff-page-data";

export const dynamic = "force-dynamic";

function relativeTime(value: Date | null) {
  if (!value) return "No sessions";
  const minutes = Math.max(1, Math.round((Date.now() - value.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}

export default async function StaffTablesPage() {
  const tables = await getStaffTables();
  const activeTables = tables.filter((table) => table.isActive).length;
  const liveSessions = tables.reduce((total, table) => total + table.activeSessions, 0);
  const pendingRequests = tables.reduce((total, table) => total + table.pendingRequests, 0);

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Floor control</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Restaurant tables</h1>
          <p className="mt-1 text-slate-600">Manage QR table entry, active sessions, and pending table requests.</p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#142653] px-3 text-sm font-semibold !text-white shadow-sm hover:bg-[#13275a]"
          href="/tables/new"
        >
          <Plus className="size-4 text-white" aria-hidden="true" />
          New table
        </Link>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <Metric icon={QrCode} label="Active QR tables" value={activeTables} />
        <Metric icon={Activity} label="Live sessions" value={liveSessions} />
        <Metric icon={ClipboardList} label="Pending requests" value={pendingRequests} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center md:col-span-2 xl:col-span-3">
            <h2 className="text-lg font-semibold text-slate-950">No tables available</h2>
            <p className="mt-1 text-sm text-slate-500">
              Table data could not be loaded, or no restaurant tables have been configured yet.
            </p>
          </div>
        ) : tables.map((table) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href={`/tables/${table.id}`}
            key={table.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Dining area</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Table {table.tableNumber}</h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  table.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {table.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <Stat label="Sessions" value={table.totalSessions} />
              <Stat label="Live" value={table.activeSessions} />
              <Stat label="Requests" value={table.pendingRequests} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">/{`table/${table.qrCodeToken}`}</p>
              <p className="mt-1">Last session: {relativeTime(table.lastStartedAt)}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <Icon className="size-5 text-blue-600" aria-hidden="true" />
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="font-bold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
