import type { MenuItemsResponse } from "@/types/menu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchMenuItems(
  restaurantId: number,
): Promise<MenuItemsResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const response = await fetch(
    `${API_BASE_URL}/restaurants/${restaurantId}/menu-items`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch menu items");
  }

  return response.json();
}