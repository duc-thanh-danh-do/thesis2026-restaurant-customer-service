import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionToken: string }> },
) {
  try {
    const { sessionToken } = await params;
    const body = (await request.json()) as {
      requestType?: string;
      description?: string;
    };
    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
    });

    if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);

    const customerRequest = await prisma.customerRequest.create({
      data: {
        sessionId: session.id,
        requestType: body.requestType ?? "staff_help",
        description: body.description,
        status: "pending",
        createdAt: new Date(),
      },
    });

    return Response.json({ request: customerRequest }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
