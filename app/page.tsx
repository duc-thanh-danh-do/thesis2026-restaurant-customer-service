import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  CookingPot,
  LayoutDashboard,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TableEntry = {
  id: number | string;
  tableNumber: string;
  qrCodeToken: string;
};

const demoTables: TableEntry[] = [
  { id: "demo-1", tableNumber: "1", qrCodeToken: "testpizza-table-1" },
  { id: "demo-2", tableNumber: "2", qrCodeToken: "testpizza-table-2" },
];

const staffFlows = [
  {
    href: "/staff-signin",
    title: "Staff sign in",
    description: "Authenticate before testing protected staff tools.",
    icon: UserRound,
  },
  {
    href: "/dashboard",
    title: "Operations dashboard",
    description: "Monitor service, orders, and active dining sessions.",
    icon: LayoutDashboard,
  },
  {
    href: "/requests",
    title: "Service requests",
    description: "Review and action guest requests.",
    icon: ClipboardList,
  },
  {
    href: "/menu/admin",
    title: "Menu manager",
    description: "Maintain menu items, availability, and details.",
    icon: CookingPot,
  },
];

const adminFlows = [
  {
    href: "/admin",
    title: "Admin workspace",
    description: "Open the operational overview and governance tools.",
    icon: ShieldCheck,
  },
  {
    href: "/admin/instructions",
    title: "AI instructions",
    description: "Review the versioned instruction workflow.",
    icon: Bot,
  },
  {
    href: "/admin/knowledge",
    title: "Knowledge base",
    description: "Manage the facts available to the assistant.",
    icon: Sparkles,
  },
  {
    href: "/restaurant-signup",
    title: "Restaurant setup",
    description: "Test the new-restaurant onboarding flow.",
    icon: Store,
  },
];

async function getTableEntries(): Promise<{ tables: TableEntry[]; usingDemoData: boolean }> {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: 1, isActive: true },
      orderBy: { tableNumber: "asc" },
      select: { id: true, tableNumber: true, qrCodeToken: true },
    });

    return {
      tables: tables.length > 0 ? tables : demoTables,
      usingDemoData: tables.length === 0,
    };
  } catch {
    return { tables: demoTables, usingDemoData: true };
  }
}

function FlowCard({
  href,
  title,
  description,
  icon: Icon,
}: (typeof staffFlows)[number]) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-3 border-border/80 bg-card py-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-accent/30">
        <CardHeader className="px-5">
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="flex items-center justify-between gap-3">
            {title}
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default async function Home() {
  const { tables, usingDemoData } = await getTableEntries();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="relative isolate border-b border-border/80 bg-primary px-4 pb-16 pt-6 text-primary-foreground sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-16 top-12 size-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-sky-300/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Store className="size-4" aria-hidden="true" />
              </span>
              TestPizza
            </Link>
            <Link
              href="/staff-signin"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Staff sign in
            </Link>
          </div>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-20">
            <div>
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-200">
                <span className="size-2 rounded-full bg-sky-300" />
                Development test hub
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Test every restaurant flow from one place.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Launch the guest experience, staff operations, and AI administration tools with real app routes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/table/${tables[0].qrCodeToken}/start`}
                  className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full bg-white px-5 text-primary hover:bg-slate-100")}
                >
                  Start guest flow <ArrowRight aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full border-white/30 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white")}
                >
                  Open dashboard
                </Link>
              </div>
            </div>

            <Card className="border-white/15 bg-white/10 py-5 text-white shadow-xl backdrop-blur-sm">
              <CardHeader className="px-5">
                <CardTitle className="text-lg">Quick test sequence</CardTitle>
                <CardDescription className="text-slate-200">
                  A simple path for validating the most important customer journey.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                <ol className="space-y-3 text-sm text-slate-100">
                  <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">1</span>Choose a table below.</li>
                  <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">2</span>Start a guest session and browse the menu.</li>
                  <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">3</span>Place an order or send a service request.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section aria-labelledby="guest-testing-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-accent">Guest experience</p>
              <h2 id="guest-testing-title" className="mt-1 text-2xl font-semibold tracking-tight">Test a table journey</h2>
              <p className="mt-2 text-sm text-muted-foreground">Each table opens the QR-based customer experience.</p>
            </div>
            {usingDemoData ? (
              <p className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900">
                Showing seeded demo tables
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tables.map((table) => (
              <Card key={table.id} className="gap-4 border-border/80 py-5">
                <CardHeader className="px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-accent">Table {table.tableNumber}</p>
                      <CardTitle className="mt-1">Customer test entry</CardTitle>
                      <CardDescription className="mt-1">QR token: {table.qrCodeToken}</CardDescription>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><QrCode className="size-5" aria-hidden="true" /></span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 px-5">
                  <Link href={`/table/${table.qrCodeToken}/start`} className={cn(buttonVariants(), "rounded-full")}>Start session</Link>
                  <Link href={`/table/${table.qrCodeToken}/menu`} className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>Browse menu</Link>
                  <Link href={`/table/${table.qrCodeToken}/chat`} className={cn(buttonVariants({ variant: "ghost" }), "rounded-full")}>
                    <MessageCircle aria-hidden="true" /> Ask assistant
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="staff-testing-title">
          <div>
            <p className="text-sm font-semibold text-accent">Operations</p>
            <h2 id="staff-testing-title" className="mt-1 text-2xl font-semibold tracking-tight">Staff testing routes</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in first, then test the protected operational workflows.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {staffFlows.map((flow) => <FlowCard key={flow.href} {...flow} />)}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="admin-testing-title">
          <div>
            <p className="text-sm font-semibold text-accent">Configuration</p>
            <h2 id="admin-testing-title" className="mt-1 text-2xl font-semibold tracking-tight">Administration and setup</h2>
            <p className="mt-2 text-sm text-muted-foreground">Manage the content, governance, and configuration that power the service.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {adminFlows.map((flow) => <FlowCard key={flow.href} {...flow} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
