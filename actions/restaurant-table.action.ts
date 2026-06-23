"use server";

import { prisma } from "@/lib/prisma";

async function getRestaurantId() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw new Error("Database has no restaurant!");
  return restaurant.id;
}

// Get active tables
export async function getAllTablesAction() {
  try {
    const rId = await getRestaurantId();
    const tables = await prisma.restaurantTable.findMany({
      where: {
        restaurantId: rId,
        isActive: true,
      },
      orderBy: {
        tableNumber: "asc",
      },
    });

    return tables;
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    return [];
  }
}
