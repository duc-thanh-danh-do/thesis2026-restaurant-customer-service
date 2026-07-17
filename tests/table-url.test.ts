import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCustomerTableUrl,
  getAppBaseUrlFromHeaders,
} from "@/lib/table-url";

const originalTrustProxyHeaders = process.env.TRUST_PROXY_HEADERS;
const originalTrustedAppHosts = process.env.TRUSTED_APP_HOSTS;
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  if (originalTrustProxyHeaders === undefined) {
    delete mutableEnv.TRUST_PROXY_HEADERS;
  } else {
    mutableEnv.TRUST_PROXY_HEADERS = originalTrustProxyHeaders;
  }

  if (originalTrustedAppHosts === undefined) {
    delete mutableEnv.TRUSTED_APP_HOSTS;
  } else {
    mutableEnv.TRUSTED_APP_HOSTS = originalTrustedAppHosts;
  }
});

test("builds encoded customer table URLs without duplicate slashes", () => {
  assert.equal(
    buildCustomerTableUrl("patio table/1", "https://restaurant.example/"),
    "https://restaurant.example/table/patio%20table%2F1",
  );
});

test("uses proxy headers only when they are explicitly enabled and allowlisted", () => {
  mutableEnv.TRUST_PROXY_HEADERS = "true";
  mutableEnv.TRUSTED_APP_HOSTS = "orders.restaurant.example:8443";

  assert.equal(
    getAppBaseUrlFromHeaders(
      new Headers({
        "x-forwarded-host": "orders.restaurant.example:8443",
        "x-forwarded-proto": "https",
      }),
    ),
    "https://orders.restaurant.example:8443",
  );

  const fallback = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  assert.equal(
    getAppBaseUrlFromHeaders(
      new Headers({
        "x-forwarded-host": "restaurant.example/attacker",
        "x-forwarded-proto": "https",
      }),
    ),
    fallback,
  );
  assert.equal(
    getAppBaseUrlFromHeaders(
      new Headers({ host: "restaurant.example", "x-forwarded-proto": "javascript" }),
    ),
    fallback,
  );

  assert.equal(
    getAppBaseUrlFromHeaders(
      new Headers({
        "x-forwarded-host": "untrusted.restaurant.example",
        "x-forwarded-proto": "https",
      }),
    ),
    fallback,
  );
});
