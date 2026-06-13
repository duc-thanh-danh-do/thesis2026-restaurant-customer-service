import { shouldHandover } from "@/lib/ai/handover";

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string };
  return Response.json({ handoverRequired: shouldHandover(body.message ?? "") });
}
