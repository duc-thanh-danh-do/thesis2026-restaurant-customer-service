import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MenuItemFilters = {
  category?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
};

export async function findMenuItems(
  restaurantId: number,
  filters: MenuItemFilters,
) {
  const where: Prisma.MenuItemWhereInput = { restaurantId };

  if (filters.category) where.category = filters.category;
  if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable;
  if (filters.isVegetarian !== undefined) {
    where.isVegetarian = filters.isVegetarian;
  }

  return prisma.menuItem.findMany({
    where,
    include: {
      menuItemAllergens: {
        include: {
          allergen: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
}
