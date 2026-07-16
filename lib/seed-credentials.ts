const INSECURE_DEMO_STAFF_PASSWORD = "staff1234";

type SeedEnvironment = Record<string, string | undefined>;

export function getSeedStaffPassword(
  environment: SeedEnvironment = process.env,
) {
  const configuredPassword = environment.STAFF_DEFAULT_PASSWORD?.trim();

  if (configuredPassword) {
    if (
      environment.NODE_ENV === "production" &&
      (configuredPassword === INSECURE_DEMO_STAFF_PASSWORD ||
        configuredPassword.length < 12)
    ) {
      throw new Error(
        "Production seed passwords must be at least 12 characters and must not use the demo password.",
      );
    }

    return configuredPassword;
  }

  if (
    environment.NODE_ENV === "production" ||
    environment.ALLOW_INSECURE_SEED_PASSWORD !== "true"
  ) {
    throw new Error(
      "STAFF_DEFAULT_PASSWORD is required. Set ALLOW_INSECURE_SEED_PASSWORD=true only for disposable development or test databases.",
    );
  }

  return INSECURE_DEMO_STAFF_PASSWORD;
}
