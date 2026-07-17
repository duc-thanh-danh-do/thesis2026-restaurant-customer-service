"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getRestaurantId() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw new Error("Database has no restaurant!");

  return restaurant.id;
}

export async function getDietaryTagsAction() {
    try {
      const rId = await getRestaurantId();
      const tags = await prisma.dietaryCatalog.findMany({
        where: { restaurantId: rId },
        orderBy: { name: "asc" },
      });
      return tags.map((tag) => tag.name);
    } catch (error) {
      console.error("Failed to fetch dietary tags:", error);
      return [];
    }
  }

export async function getIngredientsAction() {
  try {
    const rId = await getRestaurantId();
    const tags = await prisma.ingredientCatalog.findMany({
      where: { restaurantId: rId},
      orderBy: { name: "asc" },
    });
    return tags.map((tag) => tag.name);
  } catch (error) {
    console.error("Failed to fetch ingredients:", error);
    return [];
  }
}

export async function createDietaryTagAction(name: string) {
  await requireAdminUser();

  try {
    const rId = await getRestaurantId(); 
    const newTag = await prisma.dietaryCatalog.create({
      data: { name, restaurantId: rId },
    });
    return { success: true, data: newTag };
  } catch (error) {
    console.error("Failed to create dietary tag:", error);
    return { success: false, error: "Failed to create tag" };
  }
}

export async function deleteDietaryTagAction(name: string) {
  await requireAdminUser();

  try {
    const rId = await getRestaurantId(); 
    await prisma.dietaryCatalog.deleteMany({
      where: { name, restaurantId: rId },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete dietary tag:", error);
    return { success: false, error: "Failed to delete tag" };
  }
}

export async function createIngredientAction(name: string) {
    await requireAdminUser();

    try {
      const rId = await getRestaurantId(); 
      const newTag = await prisma.ingredientCatalog.create({
        data: { name, restaurantId: rId },
      });
      
      revalidatePath("/menu/ingredients");
      revalidatePath("/menu/admin"); 
  
      return { success: true, data: newTag };
    } catch (error) {
      console.error("Failed to create ingredient:", error);
      return { success: false, error: "Failed to create ingredient" };
    }
  }
  
  export async function deleteIngredientAction(name: string) {
    await requireAdminUser();

    try {
      const rId = await getRestaurantId(); 
      await prisma.ingredientCatalog.deleteMany({
        where: { name, restaurantId: rId },
      });
      
      revalidatePath("/menu/ingredients");
      revalidatePath("/menu/admin");
  
      return { success: true };
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      return { success: false, error: "Failed to delete ingredient" };
    }
  }
