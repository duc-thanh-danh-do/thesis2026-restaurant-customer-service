import AIResponseLogDetail from "@/components/ai/AIResponseLogDetail";

export default async function AiLogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;
  return (
    <main className="p-6">
      <AIResponseLogDetail logId={logId} />
    </main>
  );
}
