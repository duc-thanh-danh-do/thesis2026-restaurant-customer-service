import { findRestaurantContext } from "@/repositories/restaurant.repository";
import { toErrorResponse } from "@/lib/http-errors";

export async function GET() {
  try {
    return Response.json({ context: await findRestaurantContext(1) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
