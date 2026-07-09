export function getConfiguredAppBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelBaseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  return configuredBaseUrl ?? vercelBaseUrl ?? "http://localhost:3000";
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
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");

  if (!host || !isSafeHost(host)) return getConfiguredAppBaseUrl();

  const forwardedProto = headersList.get("x-forwarded-proto");
  const protocol =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (!isSafeProtocol(protocol)) return getConfiguredAppBaseUrl();

  return `${protocol}://${host}`;
}

export function buildCustomerTableUrl(
  qrCodeToken: string,
  baseUrl = getConfiguredAppBaseUrl(),
) {
  return `${baseUrl.replace(/\/$/, "")}/table/${encodeURIComponent(qrCodeToken)}`;
}
