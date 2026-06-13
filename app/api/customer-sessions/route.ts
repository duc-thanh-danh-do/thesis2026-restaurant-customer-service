import { createCustomerSession } from "@/services/customer-session.service";
import { createCustomerSessionSchema } from "@/lib/validation";
import { toErrorResponse } from "@/lib/http-errors";

export async function POST(request: Request) {
  try {
    const body = createCustomerSessionSchema.parse(await request.json());
    return Response.json(await createCustomerSession(body.qrCodeToken), {
      status: 201,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
