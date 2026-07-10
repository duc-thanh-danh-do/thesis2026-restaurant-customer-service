import assert from "node:assert/strict";
import test from "node:test";
import {
  chatMessageSchema,
  createCustomerRequestSchema,
  createCustomerSessionSchema,
  menuItemFilterSchema,
  updateCustomerSessionSchema,
} from "@/lib/validation";

test("chat message validation trims content and rejects invalid messages", () => {
  const parsed = chatMessageSchema.parse({
    sessionToken: "session_123",
    message: "  Can I see the menu?  ",
  });

  assert.equal(parsed.message, "Can I see the menu?");
  assert.equal(chatMessageSchema.safeParse({ sessionToken: "session_123", message: " " }).success, false);
  assert.equal(
    chatMessageSchema.safeParse({ sessionToken: "session_123", message: "x".repeat(2001) }).success,
    false,
  );
});

test("customer session validation accepts only supported status updates", () => {
  assert.deepEqual(createCustomerSessionSchema.parse({ qrCodeToken: "table_1" }), {
    qrCodeToken: "table_1",
  });
  assert.equal(updateCustomerSessionSchema.safeParse({ status: "waiting_staff" }).success, true);
  assert.equal(updateCustomerSessionSchema.safeParse({ status: "unknown" }).success, false);
});

test("menu filter validation accepts supported query filters", () => {
  assert.deepEqual(
    menuItemFilterSchema.parse({
      category: "Pizza",
      isAvailable: "true",
      dietary: "VEGETARIAN",
    }),
    {
      category: "Pizza",
      isAvailable: "true",
      dietary: "VEGETARIAN",
    },
  );

  assert.equal(menuItemFilterSchema.safeParse({ isAvailable: "yes" }).success, false);
});

test("customer request validation accepts known types and rejects oversized or unknown requests", () => {
  assert.deepEqual(
    createCustomerRequestSchema.parse({
      requestType: "bill",
      description: "  Please bring the bill.  ",
    }),
    { requestType: "bill", description: "Please bring the bill." },
  );
  assert.throws(() =>
    createCustomerRequestSchema.parse({ requestType: "delete_everything" }),
  );
  assert.throws(() =>
    createCustomerRequestSchema.parse({
      requestType: "staff_help",
      description: "x".repeat(1001),
    }),
  );
});
