import KnowledgeBaseForm from "@/components/knowledge-base/KnowledgeBaseForm";

export default async function EditKnowledgeBasePage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  return (
    <main className="p-6">
      <KnowledgeBaseForm entryId={Number(entryId)} />
    </main>
  );
}
