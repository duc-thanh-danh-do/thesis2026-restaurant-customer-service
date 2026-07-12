import { Save } from "lucide-react";
import Link from "next/link";
import { saveInstructionDraftAction } from "@/actions/admin-instruction.action";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminUser } from "@/lib/auth";
import { getInstructionVersion } from "@/services/admin-instruction.service";

export default async function InstructionEditorPage({ searchParams }: { searchParams: Promise<{ id?: string; saved?: string }> }) {
  const user = await requireAdminUser();
  const query = await searchParams;
  const id = Number(query.id);
  const draft = await getInstructionVersion(user.restaurantId, Number.isInteger(id) && id > 0 ? id : undefined);

  if (!draft || draft.status !== "DRAFT") {
    return <div className="rounded-xl bg-white p-8 text-center text-slate-600 shadow-sm">Create or open an editable draft from the instruction versions page.</div>;
  }

  return (
    <form action={saveInstructionDraftAction}>
      <input type="hidden" name="instructionId" value={draft.id} />
      <AdminPageHeader
        eyebrow={`AI instructions / Draft v${draft.version}`}
        title="Instruction editor"
        description="Changes stay isolated from production until validation, testing, approval, and publishing are complete."
        action={<button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white"><Save className="size-4" /> Save draft</button>}
      />
      {query.saved ? <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Draft saved.</p> : null}
      <div className="space-y-4">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="font-semibold text-[#142653]">Assistant role and grounding</h2>
          <p className="mt-1 text-xs text-slate-500">Define identity, trusted sources, and prohibited behaviour.</p>
          <Textarea name="rolePrompt" required defaultValue={draft.rolePrompt} className="mt-4 min-h-40 resize-y border-slate-200 leading-6" />
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="font-semibold text-[#142653]">Mandatory handover conditions</h2>
          <p className="mt-1 text-xs text-slate-500">State when the assistant must involve restaurant staff.</p>
          <Textarea name="handoverPrompt" required defaultValue={draft.handoverPrompt} className="mt-4 min-h-40 resize-y border-slate-200 leading-6" />
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="font-semibold text-[#142653]">Release notes</h2>
          <Textarea name="releaseNotes" defaultValue={draft.releaseNotes} className="mt-4 min-h-24 resize-y border-slate-200 leading-6" />
        </section>
        <div className="flex justify-end gap-3"><Link href={`/admin/instructions/validation?id=${draft.id}`} className="inline-flex h-10 items-center rounded-lg border border-[#438ed8] bg-white px-5 text-sm font-semibold text-[#438ed8]">Continue to validation</Link><button type="submit" className="h-10 rounded-lg bg-[#142653] px-5 text-sm font-semibold text-white">Save draft</button></div>
      </div>
    </form>
  );
}
