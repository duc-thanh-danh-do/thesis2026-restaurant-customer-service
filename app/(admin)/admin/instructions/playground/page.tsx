import Link from "next/link";
import { Bot, CheckCircle2, Play, UserRound } from "lucide-react";
import { testInstructionAction } from "@/actions/admin-instruction.action";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminUser } from "@/lib/auth";
import { getInstructionVersion } from "@/services/admin-instruction.service";

type TestResults = { passed: boolean; scenarios: Array<{ name: string; passed: boolean; evidence?: string }> };

export default async function InstructionPlaygroundPage({ searchParams }: { searchParams: Promise<{ id?: string; tested?: string }> }) {
  const user = await requireAdminUser();
  const query = await searchParams;
  const id = Number(query.id);
  const version = Number.isInteger(id) ? await getInstructionVersion(user.restaurantId, id) : null;
  if (!version) return <p className="rounded-xl bg-white p-8 text-center">Instruction version not found.</p>;
  const testResults = version.testResults as TestResults | null;

  return (
    <>
      <AdminPageHeader eyebrow={`AI instructions / v${version.version}`} title="Test playground" description="Run deterministic policy regression checks against this validated instruction set." action={version.status === "VALIDATED" ? <form action={testInstructionAction}><input type="hidden" name="instructionId" value={version.id} /><button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white"><Play className="size-4" /> Run policy checks</button></form> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <div className="space-y-4 text-sm">
            <div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-slate-100"><UserRound className="size-4" /></span><p className="rounded-xl bg-slate-100 p-3">Can you guarantee there is no peanut cross-contamination?</p></div>
            <div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600"><Bot className="size-4" /></span><p className="rounded-xl bg-blue-50 p-3">I cannot guarantee cross-contamination safety. I’ll involve restaurant staff so they can confirm the kitchen process.</p></div>
          </div>
        </section>
        <aside className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="font-semibold text-[#142653]">Required scenarios</h2>
          <div className="mt-4 space-y-3">
            {(testResults?.scenarios ?? [
              { name: "Unavailable menu item", passed: false },
              { name: "Uncertain allergen handover", passed: false },
              { name: "Payment dispute handover", passed: false },
            ]).map((scenario) => <div key={scenario.name} className="flex items-center justify-between gap-3 text-sm"><span>{scenario.name}</span><span className={scenario.passed ? "text-emerald-600" : "text-slate-400"}>{scenario.passed ? <CheckCircle2 className="size-4" /> : "Not run"}</span></div>)}
          </div>
          {version.status === "TESTED" ? <Link href={`/admin/instructions/review?id=${version.id}`} className="mt-6 flex h-10 items-center justify-center rounded-lg bg-[#142653] text-sm font-semibold text-white">Continue to review</Link> : null}
        </aside>
      </div>
    </>
  );
}
