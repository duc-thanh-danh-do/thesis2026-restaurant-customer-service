import StaffConversationPanel from "@/components/staff/StaffConversationPanel";

export default async function StaffSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <main className="p-6">
      <StaffConversationPanel sessionId={sessionId} />
    </main>
  );
}
