import { evaluateHandover } from "@/services/handover.service";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    restaurantId?: number;
  };
  const decision = await evaluateHandover({
    restaurantId: body.restaurantId,
    message: body.message ?? "",
  });

  return Response.json({
    handoverRequired: decision.required,
    category: decision.category,
    requestType: decision.requestType,
    reason: decision.reason,
  });
}
