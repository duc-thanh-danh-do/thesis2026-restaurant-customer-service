"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllergensAction() {
  try {
    const allergens = await prisma.allergen.findMany({
      orderBy: { name: "asc" },
    });
    return allergens.map((a) => ({ id: a.id, name: a.name, description: a.description }));
  } catch (error) {
    console.error("Failed to fetch allergens:", error);
    return [];
  }
}

export async function createAllergenAction(name: string, description?: string) {
  try {
    const existing = await prisma.allergen.findUnique({ where: { name } });
    if (existing) {
      return { success: false, error: "Allergen already exists" };
    }

    const allergen = await prisma.allergen.create({
      data: { name, description: description || null },
    });

    revalidatePath("/allergens");
    return { success: true, data: allergen };
  } catch (error) {
    console.error("Failed to create allergen:", error);
    return { success: false, error: "Failed to create allergen" };
  }
}

export async function deleteAllergenAction(id: number) {
  try {
    await prisma.allergen.delete({ where: { id } });
    revalidatePath("/allergens");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete allergen:", error);
    return { success: false, error: "Failed to delete allergen" };
  }
}
