import { getCurrentStaffUser } from "@/lib/auth";

export async function GET() {
  return Response.json({ user: await getCurrentStaffUser() });
}
