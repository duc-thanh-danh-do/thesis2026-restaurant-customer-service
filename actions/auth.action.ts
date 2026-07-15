"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/bcrypt";
import {
  createStaffSessionCookieValue,
  getStaffSessionCookieName,
  getStaffSessionTtlSeconds,
} from "@/lib/auth";
import {
  clearFailedStaffLogins,
  isStaffLoginRateLimited,
  normalizeStaffLoginIdentifier,
  recordFailedStaffLogin,
} from "@/lib/auth-rate-limit";
import { isDatabaseUnavailable } from "@/lib/fallback-data";

export type StaffSignInState = {
  success: boolean;
  error?: string;
};

async function authenticateStaff(email: string, password: string) {
  const staffUser = await prisma.staffUser.findUnique({
    where: { email },
  });

  if (!staffUser || !staffUser.isActive) return null;

  const defaultPassword = process.env.STAFF_DEFAULT_PASSWORD;
  const canUseDevelopmentDefaultPassword =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_DEFAULT_STAFF_PASSWORD === "true";
  const isValidPassword = staffUser.passwordHash
    ? await verifyPassword(password, staffUser.passwordHash)
    : Boolean(
        canUseDevelopmentDefaultPassword &&
          defaultPassword &&
          password === defaultPassword,
      );

  return isValidPassword ? staffUser : null;
}

export async function createStaffSession(email: string, password: string) {
  let staffUser = null;
  const identifier = normalizeStaffLoginIdentifier(email);

  if (isStaffLoginRateLimited(identifier)) {
    return {
      success: false,
      error: "Too many sign-in attempts. Please wait and try again.",
    };
  }

  try {
    staffUser = await authenticateStaff(identifier, password);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { success: false, error: "Staff sign in is unavailable. Please try again later." };
    }

    throw error;
  }

  if (!staffUser) {
    recordFailedStaffLogin(identifier);
    return { success: false, error: "Invalid staff email or password." };
  }

  clearFailedStaffLogins(identifier);

  const cookieStore = await cookies();
  cookieStore.set(getStaffSessionCookieName(), createStaffSessionCookieValue(staffUser.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getStaffSessionTtlSeconds(),
  });

  return { success: true };
}

export async function signOutStaffAction() {
  const cookieStore = await cookies();
  cookieStore.delete(getStaffSessionCookieName());

  redirect("/staff-signin");
}

export async function signInStaffAction(_previousState: StaffSignInState, formData: FormData): Promise<StaffSignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim() || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const result = await createStaffSession(email, password);

  if (!result.success) return result;

  redirect("/dashboard");
}
