export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

export function parseMoneyToMinorUnits(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) {
    if (value.trim().startsWith("-")) {
      throw new Error("Payment amounts must be positive.");
    }
    throw new Error("Invalid currency amount.");
  }

  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (amount <= 0) throw new Error("Payment amounts must be positive.");
  return amount;
}

export function calculateOutstandingBalance(
  totalMinor: number,
  payments: Array<{ amountMinor: number; status: PaymentStatus }>,
) {
  const confirmedMinor = payments.reduce(
    (sum, payment) =>
      payment.status === "CONFIRMED" ? sum + payment.amountMinor : sum,
    0,
  );
  return Math.max(0, totalMinor - confirmedMinor);
}

export function applyConfirmedPayment(
  balance: { totalMinor: number; paidMinor: number },
  amountMinor: number,
) {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("Payment amounts must be positive integer minor units.");
  }

  const outstanding = balance.totalMinor - balance.paidMinor;
  if (amountMinor > outstanding) {
    throw new Error("Payment exceeds the outstanding balance.");
  }

  const paidMinor = balance.paidMinor + amountMinor;
  const remainingMinor = balance.totalMinor - paidMinor;
  return { paidMinor, remainingMinor, isPaid: remainingMinor === 0 };
}
