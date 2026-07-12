import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createInstructionDraftAction } from "@/actions/admin-instruction.action";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill } from "@/components/admin/AdminPrimitives";
import { requireAdminUser } from "@/lib/auth";
import { listInstructionVersions } from "@/services/admin-instruction.service";

function tone(status: string): "success" | "info" | "warning" | "neutral" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT" || status === "VALIDATED") return "info";
  if (status === "TESTED" || status === "APPROVED") return "warning";
  return "neutral";
}

function versionHref(id: number, status: string) {
  if (status === "DRAFT") return `/admin/instructions/draft?id=${id}`;
  if (status === "VALIDATED") return `/admin/instructions/playground?id=${id}`;
  if (status === "TESTED") return `/admin/instructions/review?id=${id}`;
  if (status === "APPROVED") return `/admin/instructions/publish?id=${id}`;
  return `/admin/instructions/publish?id=${id}`;
}

export default async function InstructionVersionsPage() {
  const user = await requireAdminUser();
  const versions = await listInstructionVersions(user.restaurantId);

  return (
    <>
      <AdminPageHeader
        eyebrow="AI instructions"
        title="Instruction versions"
        description="Draft, validate, test, approve, publish, and roll back assistant behaviour with an auditable history."
        action={
          <form action={createInstructionDraftAction}>
            <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white hover:bg-[#1d356b]" type="submit">
              <Plus className="size-4" /> Create new draft
            </button>
          </form>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="hidden grid-cols-[0.7fr_1.6fr_0.9fr_0.9fr_auto] gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Version</span><span>Release note</span><span>Status</span><span>Updated</span><span>Action</span>
        </div>
        <div className="divide-y divide-slate-100">
          {versions.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">No instruction versions yet. Create the first draft to begin.</p>
          ) : versions.map((item) => (
            <div key={item.id} className="grid gap-4 px-5 py-5 md:grid-cols-[0.7fr_1.6fr_0.9fr_0.9fr_auto] md:items-center">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-[#438ed8]">v{item.version}</span>
              <p className="text-sm text-slate-700">{item.releaseNotes || "No release notes yet"}</p>
              <StatusPill tone={tone(item.status)}>{item.status}</StatusPill>
              <p className="text-sm text-slate-500">{item.updatedAt.toLocaleDateString()}</p>
              <Link href={versionHref(item.id, item.status)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#438ed8] hover:underline">Open <ArrowRight className="size-4" /></Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
