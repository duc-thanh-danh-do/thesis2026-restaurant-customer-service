import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageMenu,
  canManageRestaurant,
  createStaffSessionCookieValue,
  getStaffSessionTtlSeconds,
  verifyStaffSessionCookieValue,
} from "@/lib/auth";

const originalSecret = process.env.STAFF_SESSION_SECRET;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const originalSessionTtlSeconds = process.env.STAFF_SESSION_TTL_SECONDS;
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;

  if (originalSecret === undefined) {
    delete process.env.STAFF_SESSION_SECRET;
  } else {
    process.env.STAFF_SESSION_SECRET = originalSecret;
  }

  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }

  if (originalNextAuthSecret === undefined) {
    delete process.env.NEXTAUTH_SECRET;
  } else {
    process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
  }

  if (originalSessionTtlSeconds === undefined) {
    delete process.env.STAFF_SESSION_TTL_SECONDS;
  } else {
    process.env.STAFF_SESSION_TTL_SECONDS = originalSessionTtlSeconds;
  }
});

test("creates and verifies signed staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  const value = createStaffSessionCookieValue(42, 1_000);

  assert.equal(verifyStaffSessionCookieValue(value, 1_100), 42);
});

test("rejects tampered staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  const value = createStaffSessionCookieValue(42, 1_000);
  const tampered = value.replace("42.1000.", "43.1000.");

  assert.equal(verifyStaffSessionCookieValue(tampered, 1_100), null);
});

test("rejects malformed staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  assert.equal(verifyStaffSessionCookieValue(undefined), null);
  assert.equal(verifyStaffSessionCookieValue("not-a-session"), null);
  assert.equal(verifyStaffSessionCookieValue("1.not-hex"), null);
});

test("rejects expired staff session cookies server-side", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";
  process.env.STAFF_SESSION_TTL_SECONDS = "60";

  const value = createStaffSessionCookieValue(42, 1_000);

  assert.equal(verifyStaffSessionCookieValue(value, 1_060), 42);
  assert.equal(verifyStaffSessionCookieValue(value, 1_061), null);
  assert.equal(getStaffSessionTtlSeconds(), 60);
});

test("allows only admin users to manage restaurant and menu settings", () => {
  assert.equal(canManageRestaurant({ role: "admin" }), true);
  assert.equal(canManageMenu({ role: "admin" }), true);

  assert.equal(canManageRestaurant({ role: "staff" }), false);
  assert.equal(canManageMenu({ role: "staff" }), false);
  assert.equal(canManageRestaurant({ role: "manager" }), false);
  assert.equal(canManageMenu({ role: "owner" }), false);
});

test("requires a staff session secret in production", () => {
  mutableEnv.NODE_ENV = "production";
  delete process.env.STAFF_SESSION_SECRET;
  delete process.env.AUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;

  assert.throws(() => createStaffSessionCookieValue(42), /STAFF_SESSION_SECRET/);
});
