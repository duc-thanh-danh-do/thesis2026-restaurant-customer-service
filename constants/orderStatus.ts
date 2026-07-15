export const ORDER_STATUS = [
  "unconfirmed",
  "placed",
  "preparing",
  "ready",
  "served",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const CUSTOMER_DRAFT_ORDER_STATUS = "unconfirmed" satisfies OrderStatus;
export const CUSTOMER_CONFIRMED_ORDER_STATUS = "placed" satisfies OrderStatus;
export const STAFF_VISIBLE_ORDER_STATUSES = [
  "placed",
  "preparing",
  "ready",
] as const satisfies readonly OrderStatus[];
