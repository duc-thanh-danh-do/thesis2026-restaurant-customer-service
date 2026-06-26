import { createStaffSession } from "@/actions/auth.action";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await createStaffSession(String(body.email ?? ""), String(body.password ?? ""));

  if (!result.success) {
    return Response.json({ message: result.error }, { status: 401 });
  }

  return Response.json({ ok: true });
}
