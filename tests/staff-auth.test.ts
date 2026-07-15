import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageMenu,
  canManageRestaurant,
  createStaffSessionCookieValue,
  verifyStaffSessionCookieValue,
} from "@/lib/auth";

const originalSecret = process.env.STAFF_SESSION_SECRET;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
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
});

test("creates and verifies signed staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  const value = createStaffSessionCookieValue(42);

  assert.equal(verifyStaffSessionCookieValue(value), 42);
});

test("rejects tampered staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  const value = createStaffSessionCookieValue(42);
  const tampered = value.replace("42.", "43.");

  assert.equal(verifyStaffSessionCookieValue(tampered), null);
});

test("rejects malformed staff session cookies", () => {
  mutableEnv.NODE_ENV = "test";
  process.env.STAFF_SESSION_SECRET = "test-secret";

  assert.equal(verifyStaffSessionCookieValue(undefined), null);
  assert.equal(verifyStaffSessionCookieValue("not-a-session"), null);
  assert.equal(verifyStaffSessionCookieValue("1.not-hex"), null);
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
