import assert from "node:assert/strict";
import test from "node:test";
import { sendStaffMessageAction } from "@/actions/staff-message.action";

test("rejects staff replies for invalid session ids", async () => {
  const result = await sendStaffMessageAction(0, "Hello table 4");

  assert.deepEqual(result, { success: false, error: "Invalid session." });
});

test("rejects empty staff replies before checking authentication", async () => {
  const result = await sendStaffMessageAction(12, "   ");

  assert.deepEqual(result, { success: false, error: "Message is required." });
});
