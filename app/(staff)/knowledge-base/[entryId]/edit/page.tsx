import KnowledgeBaseForm from "@/components/knowledge-base/KnowledgeBaseForm";
import { notFound } from "next/navigation";

export default async function EditKnowledgeBasePage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const parsedEntryId = Number(entryId);

  if (!Number.isInteger(parsedEntryId) || parsedEntryId <= 0) {
    notFound();
  }

  return (
    <main className="p-6">
      <KnowledgeBaseForm entryId={parsedEntryId} />
    </main>
  );
}
