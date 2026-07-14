export type RequestStatus = "NEW" | "ACCEPTED" | "COMPLETED" | "CANCELLED";

const ALLOWED = new Set([
  "NEW:ACCEPTED",
  "NEW:CANCELLED",
  "ACCEPTED:COMPLETED",
  "ACCEPTED:CANCELLED",
]);

export function assertRequestTransition(
  from: RequestStatus,
  to: RequestStatus,
  actor: "CUSTOMER" | "STAFF",
) {
  if ((to === "ACCEPTED" || to === "COMPLETED") && actor !== "STAFF") {
    throw new Error("Only staff can accept or complete a request.");
  }
  if (!ALLOWED.has(`${from}:${to}`)) {
    throw new Error(`Invalid customer-request transition: ${from} -> ${to}.`);
  }
}
