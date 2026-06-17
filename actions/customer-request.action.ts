"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Get requests
export async function getActiveRequestsAction() {
  try {
    const requests = await prisma.customerRequest.findMany({
      where: {
        status: {
          not: "Resolved", 
        },
      },
      include: {
        session: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return requests;
  } catch (error) {
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
    const updatedRequest = await prisma.customerRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: newStatus,
        resolvedAt: newStatus === "Resolved" ? new Date() : null,
      },
    });

    revalidatePath("/", "layout");

    return { success: true, data: updatedRequest };
  } catch (error) {
    console.error("Failed to update request status:", error);
    return {
      success: false,
      error: "Unable to update status, please try again later.",
    };
  }
}

export async function getTableRequestsAction(tableNumber: string) {
  try {
    const requests = await prisma.customerRequest.findMany({
      where: {
        status: {
          not: "Resolved",
        },
        session: {
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
    console.error(`Failed to get the request of ${tableNumber}:`, error);
    return [];
  }
}
