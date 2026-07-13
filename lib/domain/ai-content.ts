export type AiContentStatus =
  | "DRAFT"
  | "VALIDATE"
  | "TEST"
  | "REVIEW"
  | "APPROVE"
  | "PUBLISH"
  | "MONITOR"
  | "ROLLBACK";

const ALLOWED = new Set([
  "DRAFT:VALIDATE",
  "VALIDATE:TEST",
  "TEST:REVIEW",
  "REVIEW:APPROVE",
  "APPROVE:PUBLISH",
  "PUBLISH:MONITOR",
  "PUBLISH:ROLLBACK",
  "MONITOR:ROLLBACK",
]);

export function assertAiContentTransition(
  from: AiContentStatus,
  to: AiContentStatus,
  role: "ADMIN" | "KITCHEN" | "STAFF",
) {
  if ((to === "APPROVE" || to === "PUBLISH" || to === "ROLLBACK") && role !== "ADMIN") {
    throw new Error("Only an administrator can approve, publish, or roll back AI content.");
  }
  if (!ALLOWED.has(`${from}:${to}`)) {
    throw new Error(`Invalid content transition: ${from} -> ${to}.`);
  }
}

export function nextDraftVersion(input: { version: number; status: AiContentStatus }) {
  return {
    version: input.version + 1,
    status: "DRAFT" as const,
  };
}
