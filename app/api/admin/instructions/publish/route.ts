import { NextResponse } from "next/server";
import { canManageRestaurant, getCurrentStaffUser } from "@/lib/auth";
import { publishInstructionVersion } from "@/services/admin-instruction.service";

export async function POST(request: Request) {
  const user = await getCurrentStaffUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageRestaurant(user)) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { instructionId?: unknown };
    const id = Number(body.instructionId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid instruction version." }, { status: 400 });
    }
    await publishInstructionVersion({
      restaurantId: user.restaurantId,
      actorStaffId: user.id,
      id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publishing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
