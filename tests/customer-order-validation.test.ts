import assert from "node:assert/strict";
import test from "node:test";
import {
  assertOrderItemTypeLimit,
  normalizeRequestedOrderItems,
} from "@/services/customer-order.service";

test("rejects fractional, oversized, and non-numeric customer order quantities", () => {
  assert.throws(() => normalizeRequestedOrderItems({ "1": 1.5 }), /whole numbers/i);
  assert.throws(() => normalizeRequestedOrderItems({ "1": 101 }), /whole numbers/i);
  assert.throws(() => normalizeRequestedOrderItems({ item: 1 }), /whole numbers/i);
});

test("accepts bounded positive integer customer order quantities", () => {
  assert.deepEqual(normalizeRequestedOrderItems({ "1": 1, "2": 100 }), [
    { id: 1, quantity: 1 },
    { id: 2, quantity: 100 },
  ]);
});

test("enforces the item-type limit after merging into an existing draft", () => {
  const existingItems = Array.from({ length: 49 }, (_, index) => `Item ${index}`);

  assert.doesNotThrow(() =>
    assertOrderItemTypeLimit(existingItems, ["Item 0", "Item 49"]),
  );
  assert.throws(
    () => assertOrderItemTypeLimit(existingItems, ["Item 49", "Item 50"]),
    /more than 50 item types/i,
  );
});
