import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionEnvironment } from "@/lib/env";
import { getSeedStaffPassword } from "@/lib/seed-credentials";
import {
  buildHandoverReply,
  buildUnrecordedHandoverReply,
} from "@/services/handover/reply";
import type { HandoverDecision } from "@/services/handover/types";

const handoverDecision: HandoverDecision = {
  required: true,
  ruleId: null,
  ruleName: "Allergy confirmation",
  category: "allergy",
  requestType: "allergy_confirmation",
  reason: "Staff should confirm allergy safety.",
  responseMessage: "Staff should confirm allergy safety.",
};

test("only confirms a staff notification after persistence", () => {
  const recorded = buildHandoverReply("", handoverDecision);
  const unrecorded = buildUnrecordedHandoverReply("", handoverDecision);

  assert.match(recorded, /I have sent this/i);
  assert.doesNotMatch(unrecorded, /I have sent this/i);
  assert.match(unrecorded, /could not notify staff/i);
});

test("requires a strong explicit seed password for production", () => {
  assert.throws(
    () => getSeedStaffPassword({ NODE_ENV: "production" }),
    /STAFF_DEFAULT_PASSWORD is required/i,
  );
  assert.throws(
    () =>
      getSeedStaffPassword({
        NODE_ENV: "production",
        STAFF_DEFAULT_PASSWORD: "staff1234",
      }),
    /must not use the demo password/i,
  );
  assert.equal(
    getSeedStaffPassword({
      NODE_ENV: "production",
      STAFF_DEFAULT_PASSWORD: "unique-production-password",
    }),
    "unique-production-password",
  );
});

test("allows the demo seed password only through an explicit non-production flag", () => {
  assert.throws(() => getSeedStaffPassword({ NODE_ENV: "development" }));
  assert.equal(
    getSeedStaffPassword({
      NODE_ENV: "test",
      ALLOW_INSECURE_SEED_PASSWORD: "true",
    }),
    "staff1234",
  );
});

test("validates the staff session secret when production starts", () => {
  assert.throws(
    () => assertProductionEnvironment({ NODE_ENV: "production" }),
    /STAFF_SESSION_SECRET/i,
  );
  assert.doesNotThrow(() =>
    assertProductionEnvironment({
      NODE_ENV: "production",
      STAFF_SESSION_SECRET: "production-session-secret",
    }),
  );
  assert.doesNotThrow(() =>
    assertProductionEnvironment({ NODE_ENV: "development" }),
  );
});
