export function isActiveSession(status: string) {
  return status === "active" || status === "waiting_staff";
}
