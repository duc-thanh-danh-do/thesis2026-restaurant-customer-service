type Attempt = {
  count: number;
  resetAt: number;
};

type AttemptStore = Map<string, Attempt>;

const globalForLoginRateLimit = globalThis as typeof globalThis & {
  staffLoginAttempts?: AttemptStore;
};

function getStore() {
  return (globalForLoginRateLimit.staffLoginAttempts ??= new Map());
}

export function getStaffLoginRateLimitConfig() {
  const maxAttempts = Number(process.env.STAFF_LOGIN_MAX_ATTEMPTS ?? 5);
  const windowSeconds = Number(process.env.STAFF_LOGIN_WINDOW_SECONDS ?? 15 * 60);

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
    throw new Error("STAFF_LOGIN_MAX_ATTEMPTS must be an integer between 1 and 100.");
  }
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 60 * 60 * 24) {
    throw new Error("STAFF_LOGIN_WINDOW_SECONDS must be an integer between 1 and 86400.");
  }

  return { maxAttempts, windowMs: windowSeconds * 1000 };
}

export function normalizeStaffLoginIdentifier(email: string) {
  return email.trim().toLowerCase();
}

export function isStaffLoginRateLimited(identifier: string, now = Date.now()) {
  const attempt = getStore().get(identifier);
  if (!attempt) return false;
  if (attempt.resetAt <= now) {
    getStore().delete(identifier);
    return false;
  }
  return attempt.count >= getStaffLoginRateLimitConfig().maxAttempts;
}

export function recordFailedStaffLogin(identifier: string, now = Date.now()) {
  const store = getStore();
  const current = store.get(identifier);
  const { windowMs } = getStaffLoginRateLimitConfig();

  if (!current || current.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return;
  }

  store.set(identifier, { ...current, count: current.count + 1 });
}

export function clearFailedStaffLogins(identifier: string) {
  getStore().delete(identifier);
}

export function resetStaffLoginRateLimitForTest() {
  getStore().clear();
}
