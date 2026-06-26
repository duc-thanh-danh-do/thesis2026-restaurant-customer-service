import StaffConversationPanel from "@/components/staff/StaffConversationPanel";
import { getStaffSessionDetail } from "@/lib/staff-page-data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getStaffSessionDetail(Number(sessionId));

  if (!session) notFound();

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Live table support</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Table {session.tableNumber}</h1>
        <p className="mt-1 text-slate-600">
          Review the conversation, open orders, and service requests before responding.
        </p>
      </div>
      <StaffConversationPanel session={session} />
    </main>
  );
}
