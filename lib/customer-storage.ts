export type StoredCart = Record<string, number>;

export function getCartStorageKey(qrToken: string) {
  return `restaurant-cart:${encodeURIComponent(qrToken)}`;
}

export function getSessionStorageKey(qrToken: string) {
  return `restaurant-session:${encodeURIComponent(qrToken)}`;
}

export function parseStoredCart(value: string | null): StoredCart {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" &&
          Number.isInteger(entry[1]) &&
          entry[1] > 0,
      ),
    );
  } catch {
    return {};
  }
}
