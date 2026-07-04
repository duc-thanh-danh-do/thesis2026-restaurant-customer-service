import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TableCreateForm from "@/components/qr/TableCreateForm";

export default function NewTablePage() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-5">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" href="/tables">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tables
        </Link>
      </div>
      <TableCreateForm />
    </main>
  );
}
