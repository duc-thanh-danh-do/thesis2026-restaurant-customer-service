"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateMenuItemInput {
  name: string;
  category: string;
  price: number;
  description: string;
  dietary?: string;
  ingredients: string;
  isVegetarian: boolean;
  isVegan: boolean;
}

type DecimalLike = number | string | { toString(): string };

type MenuItemRow = {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  category: string | null;
  price: DecimalLike;
  ingredients: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type MenuItemActionResult = Omit<MenuItemRow, "price"> & {
  price: number;
};

export async function createMenuItemAction(data: CreateMenuItemInput) {
  try {
    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId: 1,
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description,
        ingredients: data.ingredients,
        dietary: data.dietary,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        isAvailable: true,
      },
    });

    revalidatePath("/menu/admin");

    return {
      success: true,
      data: {
        ...newItem,
        price: Number(newItem.price),
      },
    };
  } catch (error) {
    console.error("Failed to add menu:", error);
    return { success: false, error: "Failed to create menu item" };
  }
}

export async function getMenuItemsAction(): Promise<MenuItemActionResult[]> {
  try {
    const items = (await prisma.menuItem.findMany({
      where: { restaurantId: 1 },
      orderBy: { id: "desc" },
    })) as MenuItemRow[];

    return items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));
  } catch (error) {
    console.error("Failed to get menu:", error);
    return [];
  }
}

// Delete Menu
export async function deleteMenuItemAction(id: number) {
  try {
    await prisma.menuItemAllergen.deleteMany({
      where: { menuItemId: id },
    });

    await prisma.menuItem.delete({
      where: { id },
    });

    revalidatePath("/menu/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete dish:", error);
    return { success: false, error: "Failed to delete dish" };
  }
}

// Menu availability
export async function toggleMenuItemAvailabilityAction(
  id: number,
  currentStatus: boolean
) {
  try {
    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !currentStatus },
    });

    revalidatePath("/menu/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to change the availability:", error);
    return { success: false, error: "Failed to toggle availability" };
  }
}

// Edit MenuItem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function editMenuItemAction(id: number, data: any) {
  try {
    const editItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        dietary: data.dietary,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        ingredients: data.ingredients,
      },
    });

    revalidatePath("/menu/admin");
    return { success: true, data: {
      ...editItem,
      price: Number(editItem.price)
    } };
  } catch (error) {
    console.error("Failed to update dish:", error);
    return { success: false, error: "Failed to update dish" };
  }
}
