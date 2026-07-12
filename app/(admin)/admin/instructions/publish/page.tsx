import { ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill } from "@/components/admin/AdminPrimitives";
import { requireAdminUser } from "@/lib/auth";
import { getInstructionVersion } from "@/services/admin-instruction.service";
import { PublishInstructionButton } from "@/components/admin/InstructionWorkflowButtons";

export default async function InstructionPublishPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await requireAdminUser();
  const { id: rawId } = await searchParams;
  const id = Number(rawId);
  const version = Number.isInteger(id) ? await getInstructionVersion(user.restaurantId, id) : null;
  if (!version) return <p className="rounded-xl bg-white p-8 text-center">Instruction version not found.</p>;

  return (
    <>
      <AdminPageHeader eyebrow={`AI instructions / v${version.version}`} title="Publish control" description="Publishing affects new customer conversations immediately. Existing logs retain their original version reference." />
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="size-5" /></span><div><h2 className="font-semibold text-[#142653]">Version v{version.version}</h2><StatusPill tone={version.status === "PUBLISHED" ? "success" : "warning"}>{version.status}</StatusPill></div></div><p className="mt-5 text-sm leading-6 text-slate-600">{version.releaseNotes || "No release notes provided."}</p></div>
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5">
          {version.status === "APPROVED" ? <div className="flex justify-end"><PublishInstructionButton id={version.id} version={version.version} /></div> : <p className="text-sm text-slate-600">This version cannot be published from its current status.</p>}
        </div>
      </section>
    </>
  );
}
