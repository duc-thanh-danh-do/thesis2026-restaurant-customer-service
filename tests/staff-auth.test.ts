import assert from "node:assert/strict";
import test from "node:test";
import {
  createStaffSessionCookieValue,
  verifyStaffSessionCookieValue,
} from "@/lib/auth";

const originalSecret = process.env.STAFF_SESSION_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;

  if (originalSecret === undefined) {
    delete process.env.STAFF_SESSION_SECRET;
  } else {
    process.env.STAFF_SESSION_SECRET = originalSecret;
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
