import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-errors";
import { createCustomerRequestSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionToken: string }> },
) {
  try {
    const { sessionToken } = await params;
    const body = createCustomerRequestSchema.parse(await request.json());
    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
    });

    if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);
    if (!["active", "waiting_staff"].includes(session.status)) {
      throw new HttpError("Session is not active", "SESSION_INACTIVE", 409);
    }

    const customerRequest = await prisma.customerRequest.create({
      data: {
        sessionId: session.id,
        requestType: body.requestType,
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
