import { prisma } from "@/lib/prisma";

export function findRestaurantContext(restaurantId: number) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menuItems: {
        include: {
          menuItemAllergens: {
            include: {
              allergen: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
      knowledgeBase: {
        where: { isActive: true },
        orderBy: { id: "asc" },
      },
    },
  });
}
