import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/http-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionToken: string }> },
) {
  try {
    const { sessionToken } = await params;
    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: { chatMessages: { orderBy: { id: "asc" } } },
    });

    return Response.json({ messages: session?.chatMessages ?? [] });
  } catch (error) {
    return toErrorResponse(error);
  }
}
