export function getStaffSessionCookieName() {
  return process.env.STAFF_SESSION_COOKIE ?? "staff_session";
}
