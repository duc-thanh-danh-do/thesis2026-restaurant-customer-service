import AIResponseLogDetail from "@/components/ai/AIResponseLogDetail";
import { requireStaffUser } from "@/lib/auth";

export default async function AiLogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;
  const staffUser = await requireStaffUser();
  return (
    <main className="p-6">
      <AIResponseLogDetail
        logId={logId}
        restaurantId={staffUser.restaurantId}
      />
    </main>
  );
}
