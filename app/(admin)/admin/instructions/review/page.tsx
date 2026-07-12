import { Check, ShieldCheck } from "lucide-react";
import { approveInstructionAction } from "@/actions/admin-instruction.action";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminUser } from "@/lib/auth";
import { getInstructionVersion } from "@/services/admin-instruction.service";

export default async function InstructionReviewPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await requireAdminUser();
  const { id: rawId } = await searchParams;
  const id = Number(rawId);
  const version = Number.isInteger(id) ? await getInstructionVersion(user.restaurantId, id) : null;
  if (!version) return <p className="rounded-xl bg-white p-8 text-center">Instruction version not found.</p>;

  return (
    <>
      <AdminPageHeader eyebrow={`AI instructions / v${version.version}`} title="Approval review" description="Review the exact content and completed gates before approving publication." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"><h2 className="font-semibold text-[#142653]">Assistant role</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{version.rolePrompt}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"><h2 className="font-semibold text-[#142653]">Handover rules</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{version.handoverPrompt}</p></div>
        </section>
        <aside className="rounded-xl bg-[#142653] p-5 text-white shadow-sm">
          <ShieldCheck className="size-6 text-blue-300" /><h2 className="mt-3 font-semibold">Release gate</h2><p className="mt-2 text-sm leading-6 text-slate-300">Validation and required test conversations have passed. Approval is recorded with your staff identity.</p>
          {version.status === "TESTED" ? <form action={approveInstructionAction} className="mt-6"><input type="hidden" name="instructionId" value={version.id} /><button type="submit" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white font-semibold text-[#142653]"><Check className="size-4" /> Approve version</button></form> : <p className="mt-6 rounded-lg bg-white/10 p-3 text-sm">Status: {version.status}</p>}
        </aside>
      </div>
    </>
  );
}
