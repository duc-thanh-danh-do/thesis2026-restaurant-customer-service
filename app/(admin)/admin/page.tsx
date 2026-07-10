import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot, BookOpenText, CircleCheck, FilePenLine, Salad, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MetricCard, StatusPill } from "@/components/admin/AdminPrimitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth";
import { getAdminDashboardData } from "@/services/admin-dashboard.service";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();
  const data = await getAdminDashboardData(user.restaurantId);
  const workspaces = [
    { href: "/admin/instructions", title: "AI instructions", detail: "Manage validation, testing, approval, publishing, and rollback.", icon: Bot, meta: `${data.drafts} active draft${data.drafts === 1 ? "" : "s"}`, color: "bg-blue-50 text-blue-600" },
    { href: "/admin/knowledge", title: "Knowledge base", detail: "Keep published policies and restaurant information accurate.", icon: BookOpenText, meta: `${data.documentCount} document${data.documentCount === 1 ? "" : "s"}`, color: "bg-violet-50 text-violet-600" },
    { href: "/admin/menu", title: "Structured menu", detail: "Control dishes, prices, allergens, and live availability.", icon: Salad, meta: `${data.menuCount} item${data.menuCount === 1 ? "" : "s"}`, color: "bg-emerald-50 text-emerald-600" },
    { href: "/admin/monitoring", title: "AI monitoring", detail: "Review response logs, handovers, audit history, and rollback.", icon: ShieldCheck, meta: `${data.handoversToday} handovers today`, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <>
      <AdminPageHeader title={`Good afternoon, ${user.name.split(" ")[0]}`} description={`Live administration data for ${data.restaurantName}.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Published version" value={data.publishedVersion} detail="Used by new customer conversations" icon={<CircleCheck className="size-5" />} tone="green" />
        <MetricCard label="Active drafts" value={data.drafts} detail="Unpublished instruction work" icon={<FilePenLine className="size-5" />} />
        <MetricCard label="Knowledge health" value={`${data.knowledgeHealth}%`} detail={`${data.documentCount} managed documents`} icon={<BookOpenText className="size-5" />} tone="violet" />
        <MetricCard label="Handovers today" value={data.handoversToday} detail={`${data.responsesToday} total responses`} icon={<AlertTriangle className="size-5" />} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold text-[#142653]">Administration workspace</h2><span className="text-xs text-slate-500">{data.restaurantName}</span></div><div className="grid gap-4 sm:grid-cols-2">{workspaces.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl ${item.color}`}><Icon className="size-5" /></span><ArrowRight className="size-4 text-slate-300" /></div><h3 className="mt-5 font-semibold text-[#142653]">{item.title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{item.detail}</p><p className="mt-4 text-xs font-semibold text-[#438ed8]">{item.meta}</p></Link>; })}</div></section>
        <Card className="gap-0 border-0 py-0 shadow-sm ring-1 ring-slate-200/80"><CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4"><CardTitle className="text-base font-bold text-[#142653]">Recent AI activity</CardTitle><Link href="/admin/monitoring" className="text-xs font-semibold text-[#438ed8]">View all</Link></CardHeader><CardContent className="divide-y divide-slate-100 px-5">{data.recentLogs.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No AI activity yet.</p> : data.recentLogs.map((log) => <div className="py-4" key={log.id}><div className="flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-semibold text-slate-800">{log.response || `AI response #${log.id}`}</p><StatusPill tone={log.handoverRequired ? "warning" : "success"}>{log.handoverRequired ? "Handover" : "Answered"}</StatusPill></div><p className="mt-1 text-xs text-slate-500">{log.instructionVersion ? `v${log.instructionVersion.version}` : "Default instructions"} · {log.createdAt?.toLocaleString() ?? "Unknown time"}</p></div>)}</CardContent></Card>
      </div>
    </>
  );
}
