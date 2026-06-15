"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
