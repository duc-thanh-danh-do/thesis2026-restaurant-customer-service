import { cookies } from "next/headers";
import { getStaffSessionCookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getStaffSessionCookieName());

  return Response.json({ ok: true });
}
