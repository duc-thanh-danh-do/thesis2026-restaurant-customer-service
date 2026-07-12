import Link from "next/link";
import { AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { validateInstructionAction } from "@/actions/admin-instruction.action";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminUser } from "@/lib/auth";
import { getInstructionVersion } from "@/services/admin-instruction.service";

type ValidationResult = { passed: boolean; issues: Array<{ severity: string; section: string; message: string }> };

export default async function InstructionValidationPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await requireAdminUser();
  const { id: rawId } = await searchParams;
  const id = Number(rawId);
  const version = Number.isInteger(id) ? await getInstructionVersion(user.restaurantId, id) : null;
  if (!version) return <p className="rounded-xl bg-white p-8 text-center">Instruction version not found.</p>;
  const validation = version.validationResults as ValidationResult | null;

  return (
    <>
      <AdminPageHeader
        eyebrow={`AI instructions / v${version.version}`}
        title="Validation results"
        description="Run deterministic safety and completeness checks before test conversations."
        action={version.status === "DRAFT" ? (
          <form action={validateInstructionAction}><input type="hidden" name="instructionId" value={version.id} /><button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white" type="submit"><Play className="size-4" /> Run validation</button></form>
        ) : undefined}
      />
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        {!validation ? <p className="text-sm text-slate-500">Validation has not been run for this draft.</p> : (
          <>
            <div className={`flex items-center gap-3 rounded-lg p-4 ${validation.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {validation.passed ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
              <p className="font-semibold">{validation.passed ? "All blocking checks passed" : "Blocking issues must be resolved"}</p>
            </div>
            <div className="mt-4 space-y-3">
              {validation.issues.length === 0 ? <p className="text-sm text-slate-600">Structured menu grounding, non-invention, allergen handover, and payment handover rules are present.</p> : validation.issues.map((issue, index) => (
                <div key={`${issue.section}-${index}`} className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">{issue.severity} · {issue.section}</p><p className="mt-1 text-sm text-slate-700">{issue.message}</p></div>
              ))}
            </div>
          </>
        )}
      </section>
      <div className="mt-5 flex justify-end gap-3">
        {version.status === "DRAFT" && validation && !validation.passed ? <Link href={`/admin/instructions/draft?id=${version.id}`} className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Return to editor</Link> : null}
        {version.status === "VALIDATED" ? <Link href={`/admin/instructions/playground?id=${version.id}`} className="inline-flex h-9 items-center rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white">Open test playground</Link> : null}
      </div>
    </>
  );
}
