import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";

export function getStaffSessionCookieName() {
  return process.env.STAFF_SESSION_COOKIE ?? "staff_session";
}

function getStaffSessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("STAFF_SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET is required in production.");
  }

  return secret ?? "development-staff-session-secret";
}

function signStaffSessionValue(staffUserId: number) {
  return createHmac("sha256", getStaffSessionSecret()).update(String(staffUserId)).digest("hex");
}

export function createStaffSessionCookieValue(staffUserId: number) {
  return `${staffUserId}.${signStaffSessionValue(staffUserId)}`;
}

export function verifyStaffSessionCookieValue(value: string | undefined) {
  if (!value) return null;

  const [idPart, signature] = value.split(".");
  const staffUserId = Number(idPart);

  if (!Number.isInteger(staffUserId) || staffUserId <= 0 || !signature) return null;

  const expected = signStaffSessionValue(staffUserId);
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
