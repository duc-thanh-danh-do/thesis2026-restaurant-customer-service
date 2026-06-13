import { sendCustomerChatMessage } from "@/services/chat-message.service";
import { chatMessageSchema } from "@/lib/validation";
import { toErrorResponse } from "@/lib/http-errors";

export async function POST(request: Request) {
  try {
    const body = chatMessageSchema.parse(await request.json());
    return Response.json(
      await sendCustomerChatMessage(body.sessionToken, body.message),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
