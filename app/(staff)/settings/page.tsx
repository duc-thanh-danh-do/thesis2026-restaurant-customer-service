import Link from "next/link";
import { BookOpen, Building2, ChevronRight, QrCode, Utensils, UsersRound, type LucideIcon } from "lucide-react";
import { getStaffSettingsData } from "@/lib/staff-page-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getStaffSettingsData();

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Restaurant admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Settings</h1>
        <p className="mt-1 text-slate-600">Manage restaurant identity, staff access, table QR setup, and AI knowledge.</p>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric icon={QrCode} label="Tables" value={`${settings.activeTableCount}/${settings.tableCount}`} />
        <Metric icon={UsersRound} label="Staff users" value={settings.staffUsers.length.toString()} />
        <Metric icon={Utensils} label="Menu items" value={settings.menuItemCount.toString()} />
        <Metric icon={BookOpen} label="Knowledge" value={settings.knowledgeBaseCount.toString()} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Restaurant profile</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{settings.restaurant.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {settings.restaurant.description ?? "No restaurant description has been configured yet."}
              </p>
            </div>
            <Building2 className="size-8 text-blue-600" aria-hidden="true" />
          </div>
          <dl className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Address" value={settings.restaurant.address ?? "Not configured"} />
            <Info label="Restaurant ID" value={`#${settings.restaurant.id}`} />
          </dl>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SettingsLink href="/settings/restaurant" label="Restaurant details" />
            <SettingsLink href="/settings/staff-users" label="Staff users" />
            <SettingsLink href="/knowledge-base" label="AI knowledge base" />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Active staff</h2>
          <div className="mt-4 space-y-3">
            {settings.staffUsers.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No staff users are configured.</p>
            ) : (
              settings.staffUsers.map((user) => (
                <div className="rounded-lg bg-slate-50 p-3" key={user.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-slate-400">{user.role ?? "Staff"}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
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
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <Icon className="size-5 text-blue-600" aria-hidden="true" />
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={href}>
      {label}
      <ChevronRight className="size-4" aria-hidden="true" />
    </Link>
  );
}
