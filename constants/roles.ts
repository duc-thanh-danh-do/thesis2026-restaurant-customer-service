export const STAFF_ROLES = ["admin", "staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
