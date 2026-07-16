import { getCurrentStaffUser } from "@/lib/auth";
import { getStaffAiLogs } from "@/lib/staff-page-data";

export async function GET() {
  const staffUser = await getCurrentStaffUser();
  if (!staffUser) {
    return Response.json(
      { error: "Staff authentication is required." },
      { status: 401 },
    );
  }

  return Response.json({
    logs: await getStaffAiLogs(staffUser.restaurantId),
  });
}
