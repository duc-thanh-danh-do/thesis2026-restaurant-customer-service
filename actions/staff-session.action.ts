"use server";

import { getCurrentStaffUser } from "@/lib/auth";
import { getActiveStaffSessionForTable } from "@/lib/staff-page-data";

export async function getActiveStaffSessionForTableAction(tableNumber: string) {
  const staffUser = await getCurrentStaffUser();

  if (!staffUser) {
    return { success: false, error: "Staff sign in is required.", session: null };
  }

  const session = await getActiveStaffSessionForTable(tableNumber);

  return { success: true, session };
}
