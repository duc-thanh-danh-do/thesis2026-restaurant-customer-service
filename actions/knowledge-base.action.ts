"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRestaurantId() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw new Error("No restaurant configured");
  return restaurant.id;
}

export type KnowledgeBaseEntry = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  isActive: boolean;
  createdAt: Date | null;
};

export async function getKnowledgeBaseEntriesAction(): Promise<KnowledgeBaseEntry[]> {
  try {
    const rId = await getRestaurantId();
    const entries = await prisma.restaurantKnowledgeBase.findMany({
      where: { restaurantId: rId },
      orderBy: { updatedAt: "desc" },
    });
    return entries;
  } catch (error) {
    console.error("Failed to fetch knowledge base:", error);
    return [];
  }
}

export async function getKnowledgeBaseEntryAction(id: number): Promise<KnowledgeBaseEntry | null> {
  try {
    const rId = await getRestaurantId();
    const entry = await prisma.restaurantKnowledgeBase.findFirst({
      where: { id, restaurantId: rId },
    });
    return entry;
  } catch (error) {
    console.error("Failed to fetch knowledge base entry:", error);
    return null;
  }
}

export async function createKnowledgeBaseEntryAction(data: {
  title: string;
  content: string;
  category?: string;
}) {
  try {
    const rId = await getRestaurantId();
    const entry = await prisma.restaurantKnowledgeBase.create({
      data: {
        restaurantId: rId,
        title: data.title,
        content: data.content,
        category: data.category || null,
      },
    });
    revalidatePath("/knowledge-base");
    return { success: true, data: entry };
  } catch (error) {
    console.error("Failed to create knowledge base entry:", error);
    return { success: false, error: "Failed to create entry" };
  }
}

export async function updateKnowledgeBaseEntryAction(
  id: number,
  data: {
    title: string;
    content: string;
    category?: string;
    isActive?: boolean;
  },
) {
  try {
    const rId = await getRestaurantId();
    await prisma.restaurantKnowledgeBase.updateMany({
      where: { id, restaurantId: rId },
      data: {
        title: data.title,
        content: data.content,
        category: data.category ?? undefined,
        isActive: data.isActive ?? undefined,
      },
    });
    revalidatePath("/knowledge-base");
    return { success: true };
  } catch (error) {
    console.error("Failed to update knowledge base entry:", error);
    return { success: false, error: "Failed to update entry" };
  }
}

export async function deleteKnowledgeBaseEntryAction(id: number) {
  try {
    const rId = await getRestaurantId();
    await prisma.restaurantKnowledgeBase.deleteMany({
      where: { id, restaurantId: rId },
    });
    revalidatePath("/knowledge-base");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete knowledge base entry:", error);
    return { success: false, error: "Failed to delete entry" };
  }
}
