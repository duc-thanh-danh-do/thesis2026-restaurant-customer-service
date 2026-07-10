import assert from "node:assert/strict";
import test from "node:test";
import {
  getCartStorageKey,
  getSessionStorageKey,
  parseStoredCart,
} from "@/lib/customer-storage";

test("scopes customer cart and session storage to the QR table", () => {
  assert.equal(getCartStorageKey("patio/1"), "restaurant-cart:patio%2F1");
  assert.equal(getSessionStorageKey("patio/1"), "restaurant-session:patio%2F1");
  assert.notEqual(getCartStorageKey("table-1"), getCartStorageKey("table-2"));
});

test("recovers safely from corrupt or hostile cart storage", () => {
  assert.deepEqual(parseStoredCart("not-json"), {});
  assert.deepEqual(parseStoredCart(JSON.stringify([1, 2, 3])), {});
  assert.deepEqual(
    parseStoredCart(
      JSON.stringify({ "1": 2, "2": -1, "3": 1.5, "4": "2", "5": 0 }),
    ),
    { "1": 2 },
  );
});
