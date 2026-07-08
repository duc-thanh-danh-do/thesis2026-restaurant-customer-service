"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { createToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateTableState = {
  success: boolean;
  error?: string;
};

export type CreateRestaurantTableActionDeps = {
  getCurrentStaffUser: () => Promise<{ restaurantId: number } | null>;
  findRestaurantTable: (args: {
    where: {
      restaurantId: number;
      tableNumber: { equals: string; mode: "insensitive" };
    };
    select: { id: true };
  }) => Promise<{ id: number } | null>;
  createRestaurantTable: (args: {
    data: {
      restaurantId: number;
      tableNumber: string;
      qrCodeToken: string;
      isActive: boolean;
      createdAt: Date;
    };
    select: { id: true };
  }) => Promise<{ id: number }>;
  createToken: (prefix: string) => string;
  isDatabaseUnavailable: (error: unknown) => boolean;
  revalidatePath: (path: string) => void;
  redirect: (path: string) => never;
};

async function getRestaurantId() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw new Error("Database has no restaurant!");
  return restaurant.id;
}

async function createRestaurantTableActionCore(
  deps: CreateRestaurantTableActionDeps,
  _previousState: CreateTableState,
  formData: FormData,
): Promise<CreateTableState> {
  const tableNumber = String(formData.get("tableNumber") ?? "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!tableNumber) {
    return { success: false, error: "Table number is required." };
  }

  if (tableNumber.length > 50) {
    return {
      success: false,
      error: "Table number must be 50 characters or less.",
    };
  }

  let tableId: number | null = null;

  try {
    const staffUser = await deps.getCurrentStaffUser();
    if (!staffUser) {
      return { success: false, error: "Staff sign in is required." };
    }

    const existingTable = await deps.findRestaurantTable({
      where: {
        restaurantId: staffUser.restaurantId,
        tableNumber: { equals: tableNumber, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (existingTable) {
      return { success: false, error: `Table ${tableNumber} already exists.` };
    }

    const table = await deps.createRestaurantTable({
      data: {
        restaurantId: staffUser.restaurantId,
        tableNumber,
        qrCodeToken: deps.createToken("table"),
        isActive,
        createdAt: new Date(),
      },
      select: { id: true },
    });

    tableId = table.id;
  } catch (error) {
    if (deps.isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to create table:", error);
    return {
      success: false,
      error: "Unable to create table. Please try again.",
    };
  }

  deps.revalidatePath("/tables");
  deps.redirect(`/tables/${tableId}`);
}

export async function createRestaurantTableAction(
  _previousState: CreateTableState,
  formData: FormData,
): Promise<CreateTableState> {
  return createRestaurantTableActionCore(
    {
      getCurrentStaffUser,
      findRestaurantTable: prisma.restaurantTable.findFirst,
      createRestaurantTable: prisma.restaurantTable.create,
      createToken,
      isDatabaseUnavailable,
      revalidatePath,
      redirect,
    },
    _previousState,
    formData,
  );
}

export { createRestaurantTableActionCore as createRestaurantTableActionForTest };

// Get active tables
export async function getAllTablesAction() {
  try {
    const staffUser = await getCurrentStaffUser();
    const rId = staffUser?.restaurantId ?? (await getRestaurantId());
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
