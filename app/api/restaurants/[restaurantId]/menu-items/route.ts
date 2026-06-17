import { getMenuItems } from "@/services/menu-item.service";
import { menuItemFilterSchema } from "@/lib/validation";
import { toErrorResponse } from "@/lib/http-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const { restaurantId } = await params;
    const parsedRestaurantId = Number(restaurantId);
    const searchParams = new URL(request.url).searchParams;
    const filters = menuItemFilterSchema.parse({
      category: searchParams.get("category") ?? undefined,
      isAvailable: searchParams.get("isAvailable") ?? undefined,
      isVegetarian: searchParams.get("isVegetarian") ?? undefined,
    });

    return Response.json(
      await getMenuItems(parsedRestaurantId, {
        category: filters.category,
        isAvailable:
          filters.isAvailable === undefined
            ? undefined
            : filters.isAvailable === "true",
        isVegetarian:
          filters.isVegetarian === undefined
            ? undefined
            : filters.isVegetarian === "true",
      }),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
