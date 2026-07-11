import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateHandover,
  shouldHandoverByDefault,
} from "@/services/handover/rules";

test("uses the highest-priority matching handover rule", async () => {
  const decision = await evaluateHandover({
    message: "I need a refund because of a peanut allergy",
  });

  assert.equal(decision.required, true);
  assert.equal(decision.category, "allergy");
  assert.equal(decision.requestType, "allergy_confirmation");
});

test("hands low-confidence answers to staff without escalating normal menu questions", async () => {
  const lowConfidence = await evaluateHandover({
    message: "What time do you close?",
    assistantReply: "I do not have enough information to answer that.",
  });

  assert.equal(lowConfidence.required, true);
  assert.equal(lowConfidence.category, "unknown_information");
  assert.equal(shouldHandoverByDefault("What vegetarian pizza do you have?"), false);
});
