import {
  closeCustomerSession,
  getCustomerSession,
} from "@/services/customer-session.service";
import { toErrorResponse } from "@/lib/http-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionToken: string }> },
) {
  try {
    const { sessionToken } = await params;
    return Response.json(await getCustomerSession(sessionToken));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ sessionToken: string }> },
) {
  try {
    const { sessionToken } = await params;
    return Response.json({ session: await closeCustomerSession(sessionToken) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
