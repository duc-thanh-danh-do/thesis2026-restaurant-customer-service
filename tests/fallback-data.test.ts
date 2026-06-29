import assert from "node:assert/strict";
import test from "node:test";
import { isDatabaseUnavailable } from "@/lib/fallback-data";

test("recognizes Prisma adapter tenant lookup failures as database unavailable", () => {
  const error = new Error("(ENOTFOUND) tenant/user postgres.engbjbnnwvnarnepauce not found");

  assert.equal(isDatabaseUnavailable(error), true);
});

test("recognizes Prisma adapter failures when details are nested in cause", () => {
  const error = Object.assign(new Error("DriverAdapterError"), {
    cause: {
      originalCode: "XX000",
      originalMessage: "(ENOTFOUND) tenant/user postgres.engbjbnnwvnarnepauce not found",
      message: "(ENOTFOUND) tenant/user postgres.engbjbnnwvnarnepauce not found",
    },
  });

  assert.equal(isDatabaseUnavailable(error), true);
});

test("recognizes Prisma request errors from structured code fields", () => {
  const error = Object.assign(new Error("Invalid prisma.restaurantTable.findMany invocation"), {
    code: "ECONNREFUSED",
    meta: { modelName: "RestaurantTable" },
  });

  assert.equal(isDatabaseUnavailable(error), true);
});

test("does not classify unrelated application errors as database unavailable", () => {
  const error = new Error("Menu item name is required");

  assert.equal(isDatabaseUnavailable(error), false);
});
