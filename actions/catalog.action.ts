"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDietaryTagsAction() {
    try {
      const staffUser = await requireAdminUser();
      const rId = staffUser.restaurantId;
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
    const staffUser = await requireAdminUser();
    const rId = staffUser.restaurantId;
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
  const staffUser = await requireAdminUser();

  try {
    const rId = staffUser.restaurantId;
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
  const staffUser = await requireAdminUser();

  try {
    const rId = staffUser.restaurantId;
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
    const staffUser = await requireAdminUser();

    try {
      const rId = staffUser.restaurantId;
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
    const staffUser = await requireAdminUser();

    try {
      const rId = staffUser.restaurantId;
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
