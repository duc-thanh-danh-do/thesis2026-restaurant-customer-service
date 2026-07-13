import { NextResponse } from "next/server";
import { canManageRestaurant, getCurrentStaffUser } from "@/lib/auth";
import { rollbackInstructionVersion } from "@/services/admin-instruction.service";

export async function POST(request: Request) {
  const user = await getCurrentStaffUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageRestaurant(user)) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { targetId?: unknown };
    const targetId = Number(body.targetId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: "Invalid rollback target." }, { status: 400 });
    }
    await rollbackInstructionVersion({
      restaurantId: user.restaurantId,
      actorStaffId: user.id,
      targetId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rollback failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
