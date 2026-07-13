export const INSTRUCTION_STATUSES = [
  "DRAFT",
  "VALIDATED",
  "TESTED",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type InstructionStatus = (typeof INSTRUCTION_STATUSES)[number];
export type ValidationIssue = {
  severity: "BLOCKING" | "WARNING";
  section: "ROLE" | "HANDOVER" | "NOTES";
  message: string;
};

export type InstructionRegressionResults = {
  passed: boolean;
  scenarios: Array<{
    name: string;
    passed: boolean;
    evidence: string;
  }>;
};

const INSTRUCTION_TRANSITIONS = new Set([
  "DRAFT:VALIDATED",
  "VALIDATED:TESTED",
  "TESTED:APPROVED",
  "APPROVED:PUBLISHED",
  "PUBLISHED:ARCHIVED",
]);

export function assertInstructionStatusTransition(
  from: InstructionStatus,
  to: InstructionStatus,
) {
  if (!INSTRUCTION_TRANSITIONS.has(`${from}:${to}`)) {
    throw new Error(`Invalid instruction transition: ${from} -> ${to}.`);
  }
}

export function validateInstructionDraft(input: {
  rolePrompt: string;
  handoverPrompt: string;
  releaseNotes: string;
}) {
  const rolePrompt = input.rolePrompt.toLowerCase();
  const handoverPrompt = input.handoverPrompt.toLowerCase();
  const issues: ValidationIssue[] = [];

  if (!rolePrompt.includes("structured menu") || !rolePrompt.includes("invent")) {
    issues.push({
      severity: "BLOCKING",
      section: "ROLE",
      message: "Require structured menu data and explicitly prohibit invented menu facts.",
    });
  }
  if (!handoverPrompt.includes("allergen") || !handoverPrompt.includes("hand over")) {
    issues.push({
      severity: "BLOCKING",
      section: "HANDOVER",
      message: "Require staff handover for uncertain allergen questions.",
    });
  }
  if (!handoverPrompt.includes("payment")) {
    issues.push({
      severity: "BLOCKING",
      section: "HANDOVER",
      message: "Require staff handover for payment disputes.",
    });
  }
  if (!input.releaseNotes.trim()) {
    issues.push({
      severity: "WARNING",
      section: "NOTES",
      message: "Add release notes so reviewers understand the change.",
    });
  }

  return {
    passed: !issues.some((issue) => issue.severity === "BLOCKING"),
    issues,
  };
}

export function canPublishKnowledgeDocument(input: {
  ingestionStatus: string;
  publicationStatus: string;
  validationPassed: boolean;
}) {
  return (
    input.ingestionStatus.toLowerCase() === "ready" &&
    input.publicationStatus === "APPROVED" &&
    input.validationPassed
  );
}

export function buildPublishedInstructionPrompt(input: {
  rolePrompt: string;
  handoverPrompt: string;
}) {
  return [input.rolePrompt.trim(), "", "Mandatory staff handover rules:", input.handoverPrompt.trim()].join("\n");
}

export function runInstructionRegressionSuite(input: {
  rolePrompt: string;
  handoverPrompt: string;
}): InstructionRegressionResults {
  const prompt = buildPublishedInstructionPrompt(input).toLowerCase();
  const scenarios = [
    {
      name: "Unavailable menu item",
      passed:
        prompt.includes("structured menu") &&
        /never\s+invent|do not invent/.test(prompt) &&
        prompt.includes("availability"),
      evidence: "Requires structured menu data, availability handling, and no invented facts.",
    },
    {
      name: "Uncertain allergen handover",
      passed:
        prompt.includes("allergen") &&
        prompt.includes("cross-contamination") &&
        /hand\s+over|handover/.test(prompt),
      evidence: "Requires staff involvement for allergen and cross-contamination questions.",
    },
    {
      name: "Payment dispute handover",
      passed:
        prompt.includes("payment") &&
        prompt.includes("dispute") &&
        /hand\s+over|handover/.test(prompt),
      evidence: "Requires staff involvement for payment disputes.",
    },
  ];

  return { passed: scenarios.every((scenario) => scenario.passed), scenarios };
}
