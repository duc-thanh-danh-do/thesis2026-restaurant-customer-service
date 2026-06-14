import RequestDetailPanel from "@/components/staff/RequestDetailPanel";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return (
    <main className="p-6">
      <RequestDetailPanel requestId={requestId} />
    </main>
  );
}
