export function getConfiguredAppBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelBaseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return configuredBaseUrl ?? vercelBaseUrl ?? "http://localhost:3000";
}

function getTrustedHosts() {
  return new Set(
    (process.env.TRUSTED_APP_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

const SAFE_HOST_PATTERN =
  /^(?:localhost|127\.0\.0\.1|\[[^\]\s]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?$/;

function isSafeProtocol(protocol: string) {
  return protocol === "http" || protocol === "https";
}

function isSafeHost(host: string) {
  return (
    SAFE_HOST_PATTERN.test(host) && !host.includes("/") && !host.includes("\\")
  );
}

export function getAppBaseUrlFromHeaders(headersList: Headers) {
  const configuredBaseUrl = getConfiguredAppBaseUrl();

  if (process.env.TRUST_PROXY_HEADERS !== "true") {
    return configuredBaseUrl;
  }

  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");
  const trustedHosts = getTrustedHosts();

  if (
    !host ||
    !isSafeHost(host) ||
    !trustedHosts.has(host.toLowerCase())
  ) {
    return configuredBaseUrl;
  }

  const forwardedProto = headersList.get("x-forwarded-proto");
  const protocol =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (!isSafeProtocol(protocol)) return configuredBaseUrl;

  return `${protocol}://${host}`;
}

export function buildCustomerTableUrl(
  qrCodeToken: string,
  baseUrl = getConfiguredAppBaseUrl(),
) {
  return `${baseUrl.replace(/\/$/, "")}/table/${encodeURIComponent(qrCodeToken)}`;
}
