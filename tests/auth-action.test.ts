import assert from "node:assert/strict";
import test from "node:test";
import { signInStaffAction } from "@/actions/auth.action";

test("staff sign-in action rejects missing credentials before database access", async () => {
  const result = await signInStaffAction({ success: false }, new FormData());

  assert.deepEqual(result, {
    success: false,
    error: "Email and password are required.",
  });
});
