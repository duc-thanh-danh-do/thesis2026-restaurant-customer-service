import type { MenuItemsResponse } from "@/types/menu-item";
import { findMenuItems, type MenuItemFilters } from "@/repositories/menu-item.repository";
import { fallbackMenuItems, isDatabaseUnavailable } from "@/lib/fallback-data";

export async function getMenuItems(
  restaurantId: number,
  filters: MenuItemFilters,
): Promise<MenuItemsResponse> {
  try {
    const menuItems = await findMenuItems(restaurantId, filters);

    return {
      menuItems: menuItems.map((item) => ({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        ingredients: item.ingredients,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        allergens: item.menuItemAllergens.map(({ allergen }) => ({
          id: allergen.id,
          name: allergen.name,
          description: allergen.description,
        })),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;

    return {
      menuItems: fallbackMenuItems.filter((item) => {
        if (item.restaurantId !== restaurantId) return false;
        if (filters.category && item.category !== filters.category) return false;
        if (
          filters.isAvailable !== undefined &&
          item.isAvailable !== filters.isAvailable
        ) {
          return false;
        }
        if (
          filters.isVegetarian !== undefined &&
          item.isVegetarian !== filters.isVegetarian
        ) {
          return false;
        }
        return true;
      }),
    };
  }
}
