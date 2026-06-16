"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateMenuItemInput {
  name: string;
  category: string;
  price: number;
  description: string;
  ingredients: string;
  isVegetarian: boolean;
  isVegan: boolean;
}

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

export async function getMenuItemsAction() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: 1 },
      orderBy: { id: "desc" },
    });

    return items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));
  } catch (error) {
    console.error("Failed to get menu:", error);
    return [];
  }
}
