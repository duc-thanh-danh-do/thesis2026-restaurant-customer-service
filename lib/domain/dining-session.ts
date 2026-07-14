export const DINING_SESSION_STATUSES = [
  "PROVISIONAL",
  "ACTIVE",
  "CHECKOUT_REQUESTED",
  "PAYMENT_PENDING",
  "PAID",
  "CLOSING",
  "CLOSED",
] as const;

export type DiningSessionStatus = (typeof DINING_SESSION_STATUSES)[number];
export type DiningSessionActor = "CUSTOMER" | "STAFF" | "SYSTEM";

const NEXT_STATUS = new Map<DiningSessionStatus, DiningSessionStatus>([
  ["PROVISIONAL", "ACTIVE"],
  ["ACTIVE", "CHECKOUT_REQUESTED"],
  ["CHECKOUT_REQUESTED", "PAYMENT_PENDING"],
  ["PAYMENT_PENDING", "PAID"],
  ["PAID", "CLOSING"],
  ["CLOSING", "CLOSED"],
]);

export function canTransitionDiningSession(
  from: DiningSessionStatus,
  to: DiningSessionStatus,
) {
  return NEXT_STATUS.get(from) === to;
}

export function assertDiningSessionTransition(
  from: DiningSessionStatus,
  to: DiningSessionStatus,
  actor: DiningSessionActor,
) {
  if (!canTransitionDiningSession(from, to)) {
    throw new Error(`Invalid dining-session transition: ${from} -> ${to}.`);
  }

  if (from === "PAYMENT_PENDING" && to === "PAID" && actor !== "SYSTEM") {
    throw new Error("A session becomes paid only after confirmed payment.");
  }

  if (from === "PAID" && to === "CLOSING" && actor !== "STAFF") {
    throw new Error("Only authorised staff can begin closing a paid session.");
  }

  if (from === "CLOSING" && to === "CLOSED" && actor !== "STAFF") {
    throw new Error("Only authorised staff can close a cleaned session.");
  }
}

export function meaningfulActionStatus(
  status: DiningSessionStatus,
  action: "MESSAGE" | "ORDER" | "STAFF_REQUEST",
): DiningSessionStatus {
  void action;
  return status === "PROVISIONAL" ? "ACTIVE" : status;
}
