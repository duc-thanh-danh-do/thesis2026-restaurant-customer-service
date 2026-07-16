import { getCurrentStaffUser } from "@/lib/auth";
import { getStaffAiLogDetail } from "@/lib/staff-page-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  const staffUser = await getCurrentStaffUser();
  if (!staffUser) {
    return Response.json(
      { error: "Staff authentication is required." },
      { status: 401 },
    );
  }

  const { logId } = await params;
  const parsedLogId = Number(logId);
  if (!Number.isInteger(parsedLogId) || parsedLogId <= 0) {
    return Response.json({ error: "Invalid AI log ID." }, { status: 400 });
  }

  const log = await getStaffAiLogDetail(
    parsedLogId,
    staffUser.restaurantId,
  );
  if (!log) {
    return Response.json({ error: "AI response log not found." }, { status: 404 });
  }

  return Response.json({ log });
}
