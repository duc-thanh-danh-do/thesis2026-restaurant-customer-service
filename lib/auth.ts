import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STAFF_ROLES, type StaffRole } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { getConfiguredStaffSessionSecret } from "@/lib/env";

type StaffUserWithRole = {
  role: string | null;
};

export function getStaffSessionCookieName() {
  return process.env.STAFF_SESSION_COOKIE ?? "staff_session";
}

export function getStaffSessionTtlSeconds() {
  const configured = Number(process.env.STAFF_SESSION_TTL_SECONDS ?? 60 * 60 * 12);

  if (!Number.isInteger(configured) || configured <= 0 || configured > 60 * 60 * 24 * 7) {
    throw new Error("STAFF_SESSION_TTL_SECONDS must be an integer between 1 and 604800.");
  }

  return configured;
}

function getStaffSessionSecret() {
  const secret = getConfiguredStaffSessionSecret();

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("STAFF_SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET is required in production.");
  }

  return secret ?? "development-staff-session-secret";
}

function signStaffSessionValue(staffUserId: number, issuedAt: number) {
  return createHmac("sha256", getStaffSessionSecret())
    .update(`${staffUserId}.${issuedAt}`)
    .digest("hex");
}

export function createStaffSessionCookieValue(staffUserId: number, issuedAt = Math.floor(Date.now() / 1000)) {
  return `${staffUserId}.${issuedAt}.${signStaffSessionValue(staffUserId, issuedAt)}`;
}

export function verifyStaffSessionCookieValue(
  value: string | undefined,
  now = Math.floor(Date.now() / 1000),
) {
  if (!value) return null;

  const [idPart, issuedAtPart, signature] = value.split(".");
  const staffUserId = Number(idPart);
  const issuedAt = Number(issuedAtPart);

  if (
    !Number.isInteger(staffUserId) ||
    staffUserId <= 0 ||
    !Number.isInteger(issuedAt) ||
    issuedAt <= 0 ||
    !signature ||
    issuedAt > now + 60 ||
    now - issuedAt > getStaffSessionTtlSeconds()
  ) {
    return null;
  }

  const expected = signStaffSessionValue(staffUserId, issuedAt);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return staffUserId;
}

export async function getCurrentStaffUser() {
  const cookieStore = await cookies();
  const staffUserId = verifyStaffSessionCookieValue(cookieStore.get(getStaffSessionCookieName())?.value);

  if (!staffUserId) return null;

  try {
    return await prisma.staffUser.findFirst({
      where: {
        id: staffUserId,
        isActive: true,
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return null;
    throw error;
  }
}

export async function requireStaffUser() {
  const staffUser = await getCurrentStaffUser();

  if (!staffUser) {
    redirect("/staff-signin");
  }

  return staffUser;
}

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function canManageRestaurant(staffUser: StaffUserWithRole | null | undefined) {
  return staffUser?.role === "admin";
}

export function canManageMenu(staffUser: StaffUserWithRole | null | undefined) {
  return staffUser?.role === "admin";
}

export async function requireAdminUser() {
  const staffUser = await requireStaffUser();

  if (!canManageRestaurant(staffUser)) {
    redirect("/dashboard");
  }

  return staffUser;
}
