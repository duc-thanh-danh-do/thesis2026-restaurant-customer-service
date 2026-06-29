import assert from "node:assert/strict";
import test from "node:test";
import { canUseDemoStaffData } from "@/lib/staff-page-data";

const originalNodeEnv = process.env.NODE_ENV;
const originalDisableStaffDemoData = process.env.DISABLE_STAFF_DEMO_DATA;
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;
  if (originalDisableStaffDemoData === undefined) {
    delete process.env.DISABLE_STAFF_DEMO_DATA;
  } else {
    process.env.DISABLE_STAFF_DEMO_DATA = originalDisableStaffDemoData;
  }
});

test("does not allow demo staff data in production", () => {
  mutableEnv.NODE_ENV = "production";
  delete process.env.DISABLE_STAFF_DEMO_DATA;

  assert.equal(canUseDemoStaffData(), false);
});

test("allows demo staff data in development unless explicitly disabled", () => {
  mutableEnv.NODE_ENV = "development";
  delete process.env.DISABLE_STAFF_DEMO_DATA;

  assert.equal(canUseDemoStaffData(), true);

  process.env.DISABLE_STAFF_DEMO_DATA = "true";

  assert.equal(canUseDemoStaffData(), false);
});
