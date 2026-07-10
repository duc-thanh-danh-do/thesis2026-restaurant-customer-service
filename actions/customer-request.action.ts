"use server";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { getCurrentStaffUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const REQUEST_STATUSES = new Set(["Waiting", "In progress", "Resolved"]);

type RequestActionDependencies = {
  getCurrentStaffUser: () => Promise<{ restaurantId: number } | null>;
  findActiveRequests: (restaurantId: number) => Promise<unknown[]>;
};

type UpdateRequestDependencies = {
  getCurrentStaffUser: () => Promise<{ restaurantId: number } | null>;
  updateOwnedRequest: (input: {
    requestId: number;
    restaurantId: number;
    status: string;
    resolvedAt: Date | null;
  }) => Promise<number>;
};

async function getActiveRequestsActionCore(deps: RequestActionDependencies) {
  const staffUser = await deps.getCurrentStaffUser();
  if (!staffUser) return [];
  return deps.findActiveRequests(staffUser.restaurantId);
}

async function updateRequestStatusCore(
  deps: UpdateRequestDependencies,
  requestId: number,
  newStatus: string,
) {
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return { success: false, error: "Invalid request." };
  }
  if (!REQUEST_STATUSES.has(newStatus)) {
    return { success: false, error: "Invalid request status." };
  }

  const staffUser = await deps.getCurrentStaffUser();
  if (!staffUser) {
    return { success: false, error: "Staff sign in is required." };
  }

  const updatedCount = await deps.updateOwnedRequest({
    requestId,
    restaurantId: staffUser.restaurantId,
    status: newStatus,
    resolvedAt: newStatus === "Resolved" ? new Date() : null,
  });
  if (updatedCount === 0) {
    return { success: false, error: "Request not found." };
  }

  return { success: true };
}

// Get requests
export async function getActiveRequestsAction() {
  try {
    return await getActiveRequestsActionCore({
      getCurrentStaffUser,
      findActiveRequests: (restaurantId) => prisma.customerRequest.findMany({
        where: {
          status: { not: "Resolved" },
          session: { restaurantId },
        },
        include: {
          session: {
            include: { table: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return [];

    console.error("Failed to get request:", error);
    return [];
  }
}

/* Update status */
export async function updateRequestStatus(
  requestId: number,
  newStatus: string
) {
  try {
    const result = await updateRequestStatusCore(
      {
        getCurrentStaffUser,
        updateOwnedRequest: async ({ requestId: id, restaurantId, status, resolvedAt }) => {
          const updated = await prisma.customerRequest.updateMany({
            where: { id, session: { restaurantId } },
            data: { status, resolvedAt },
          });
          return updated.count;
        },
      },
      requestId,
      newStatus,
    );

    if (result.success) revalidatePath("/", "layout");

    return result;
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        success: false,
        error: "Database is unavailable. Please try again later.",
      };
    }

    console.error("Failed to update request status:", error);
    return {
      success: false,
      error: "Unable to update status, please try again later.",
    };
  }
}

export async function getTableRequestsAction(tableNumber: string) {
  try {
    const staffUser = await getCurrentStaffUser();
    if (!staffUser) return [];

    const requests = await prisma.customerRequest.findMany({
      where: {
        status: {
          not: "Resolved",
        },
        session: {
          restaurantId: staffUser.restaurantId,
          table: {
            tableNumber: tableNumber,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return requests;
  } catch (error) {
    if (isDatabaseUnavailable(error)) return [];

    console.error(`Failed to get the request of ${tableNumber}:`, error);
    return [];
  }
}

export {
  getActiveRequestsActionCore as getActiveRequestsActionForTest,
  updateRequestStatusCore as updateRequestStatusForTest,
};
