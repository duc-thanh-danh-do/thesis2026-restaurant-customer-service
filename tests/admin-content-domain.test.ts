import assert from "node:assert/strict";
import test from "node:test";
import {
  assertInstructionStatusTransition,
  buildPublishedInstructionPrompt,
  canPublishKnowledgeDocument,
  runInstructionRegressionSuite,
  validateInstructionDraft,
} from "@/lib/domain/admin-content";

test("instruction versions cannot skip validation, testing, or approval", () => {
  assert.doesNotThrow(() => assertInstructionStatusTransition("DRAFT", "VALIDATED"));
  assert.doesNotThrow(() => assertInstructionStatusTransition("VALIDATED", "TESTED"));
  assert.doesNotThrow(() => assertInstructionStatusTransition("TESTED", "APPROVED"));
  assert.doesNotThrow(() => assertInstructionStatusTransition("APPROVED", "PUBLISHED"));
  assert.throws(
    () => assertInstructionStatusTransition("DRAFT", "PUBLISHED"),
    /invalid instruction transition/i,
  );
});

test("instruction validation blocks unsafe or incomplete drafts", () => {
  const unsafe = validateInstructionDraft({
    rolePrompt: "Help customers.",
    handoverPrompt: "Be friendly.",
    releaseNotes: "",
  });

  assert.equal(unsafe.passed, false);
  assert.ok(unsafe.issues.some((issue) => issue.severity === "BLOCKING"));

  const safe = validateInstructionDraft({
    rolePrompt:
      "Help restaurant guests using only structured menu and published knowledge data. Never invent prices, allergens, or availability.",
    handoverPrompt:
      "Immediately hand over uncertain allergen or cross-contamination questions, payment disputes, emergencies, and physical staff requests.",
    releaseNotes: "Strengthen allergen uncertainty and structured menu rules.",
  });

  assert.equal(safe.passed, true);
  assert.equal(safe.issues.some((issue) => issue.severity === "BLOCKING"), false);
});

test("only ready, validated, approved knowledge documents can be published", () => {
  assert.equal(
    canPublishKnowledgeDocument({
      ingestionStatus: "ready",
      publicationStatus: "APPROVED",
      validationPassed: true,
    }),
    true,
  );
  assert.equal(
    canPublishKnowledgeDocument({
      ingestionStatus: "ready",
      publicationStatus: "DRAFT",
      validationPassed: true,
    }),
    false,
  );
  assert.equal(
    canPublishKnowledgeDocument({
      ingestionStatus: "failed",
      publicationStatus: "APPROVED",
      validationPassed: true,
    }),
    false,
  );
});

test("published instruction content is composed deterministically for new chats", () => {
  const prompt = buildPublishedInstructionPrompt({
    rolePrompt: "Use trusted restaurant data.",
    handoverPrompt: "Hand over uncertain safety questions.",
  });

  assert.match(prompt, /Use trusted restaurant data/);
  assert.match(prompt, /Hand over uncertain safety questions/);
});

test("instruction regression suite records failing policy scenarios instead of unconditional passes", () => {
  const failed = runInstructionRegressionSuite({
    rolePrompt: "Answer customer questions.",
    handoverPrompt: "Escalate when needed.",
  });
  assert.equal(failed.passed, false);
  assert.ok(failed.scenarios.some((scenario) => !scenario.passed));

  const passed = runInstructionRegressionSuite({
    rolePrompt: "Use structured menu data. Never invent menu facts or availability.",
    handoverPrompt: "Hand over uncertain allergen, cross-contamination, and payment dispute questions to staff.",
  });
  assert.equal(passed.passed, true);
});
