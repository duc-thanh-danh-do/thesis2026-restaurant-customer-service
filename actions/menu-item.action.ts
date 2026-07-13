"use server";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { requireAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CreateMenuItemInput {
  name: string;
  category: string;
  price: number;
  description: string;
  dietary?: string;
  ingredients: string;
  imageUrl?: string | null;
}

type EditMenuItemInput = Partial<CreateMenuItemInput>;

type DecimalLike = number | string | { toString(): string };

type MenuItemRow = {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  category: string | null;
  price: DecimalLike;
  ingredients: string | null;
  dietary: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type MenuItemActionResult = Omit<MenuItemRow, "price"> & {
  price: number;
};

function serializeMenuItem(item: MenuItemRow): MenuItemActionResult {
  return {
    ...item,
    price: Number(item.price),
  };
}

async function auditMenuAction(input: {
  restaurantId: number;
  actorStaffId: number;
  action: string;
  menuItemId: number;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      restaurantId: input.restaurantId,
      actorStaffId: input.actorStaffId,
      actorType: "STAFF",
      action: input.action,
      metadata: { menuItemId: input.menuItemId, ...input.metadata },
    },
  });
}

export async function createMenuItemAction(data: CreateMenuItemInput) {
  const staffUser = await requireAdminUser();

  try {
    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId: staffUser.restaurantId,
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description,
        ingredients: data.ingredients,
        dietary: data.dietary,
        imageUrl: data.imageUrl,
        isAvailable: true,
      },
    });
    await auditMenuAction({ restaurantId: staffUser.restaurantId, actorStaffId: staffUser.id, action: "MENU_ITEM_CREATED", menuItemId: newItem.id });

    revalidatePath("/menu/admin");
    revalidatePath("/admin/menu");

    return {
      success: true,
      data: serializeMenuItem(newItem),
    };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to add menu:", error);
    return { success: false, error: "Failed to create menu item" };
  }
}

export async function getMenuItemsAction(): Promise<MenuItemActionResult[]> {
  const staffUser = await requireAdminUser();

  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: staffUser.restaurantId },
      orderBy: { id: "desc" },
    });

    return items.map((item) => serializeMenuItem(item));
  } catch (error) {
    if (isDatabaseUnavailable(error)) return [];

    console.error("Failed to get menu:", error);
    return [];
  }
}

// Delete Menu
export async function deleteMenuItemAction(id: number) {
  const staffUser = await requireAdminUser();

  try {
    const ownedItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: staffUser.restaurantId },
      select: { id: true },
    });
    if (!ownedItem) return { success: false, error: "Menu item not found" };

    await prisma.menuItemAllergen.deleteMany({
      where: { menuItemId: id },
    });

    await prisma.menuItem.delete({
      where: { id },
    });
    await auditMenuAction({ restaurantId: staffUser.restaurantId, actorStaffId: staffUser.id, action: "MENU_ITEM_DELETED", menuItemId: id });

    revalidatePath("/menu/admin");
    revalidatePath("/admin/menu");
    return { success: true };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to delete dish:", error);
    return { success: false, error: "Failed to delete dish" };
  }
}

// Menu availability
export async function toggleMenuItemAvailabilityAction(
  id: number,
  currentStatus: boolean
) {
  const staffUser = await requireAdminUser();

  try {
    const ownedItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: staffUser.restaurantId },
      select: { id: true },
    });
    if (!ownedItem) return { success: false, error: "Menu item not found" };

    await prisma.$transaction([
      prisma.menuItem.update({
        where: { id },
        data: { isAvailable: !currentStatus },
      }),
      prisma.auditLog.create({
        data: {
          restaurantId: staffUser.restaurantId,
          actorStaffId: staffUser.id,
          actorType: "STAFF",
          action: "MENU_AVAILABILITY_CHANGED",
          metadata: { menuItemId: id, isAvailable: !currentStatus },
        },
      }),
    ]);

    revalidatePath("/menu/admin");
    revalidatePath("/admin/menu");
    return { success: true };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to change the availability:", error);
    return { success: false, error: "Failed to toggle availability" };
  }
}

// Edit MenuItem
export async function editMenuItemAction(id: number, data: EditMenuItemInput) {
  const staffUser = await requireAdminUser();

  try {
    const ownedItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: staffUser.restaurantId },
      select: { id: true },
    });
    if (!ownedItem) return { success: false, error: "Menu item not found" };

    const editItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        dietary: data.dietary,
        ingredients: data.ingredients,
        imageUrl: data.imageUrl,
      },
    });
    await auditMenuAction({ restaurantId: staffUser.restaurantId, actorStaffId: staffUser.id, action: "MENU_ITEM_UPDATED", menuItemId: id });

    revalidatePath("/menu/admin");
    revalidatePath("/admin/menu");
    return { success: true, data: serializeMenuItem(editItem) };
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to update dish:", error);
    return { success: false, error: "Failed to update dish" };
  }
}
