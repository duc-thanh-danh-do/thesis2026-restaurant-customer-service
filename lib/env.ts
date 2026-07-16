export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

type RuntimeEnvironment = Record<string, string | undefined>;

export function getConfiguredStaffSessionSecret(
  environment: RuntimeEnvironment = process.env,
) {
  return (
    environment.STAFF_SESSION_SECRET?.trim() ||
    environment.AUTH_SECRET?.trim() ||
    environment.NEXTAUTH_SECRET?.trim() ||
    null
  );
}

export function assertProductionEnvironment(
  environment: RuntimeEnvironment = process.env,
) {
  if (environment.NODE_ENV !== "production") return;

  if (!getConfiguredStaffSessionSecret(environment)) {
    throw new Error(
      "STAFF_SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET is required in production.",
    );
  }
}
