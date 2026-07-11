import assert from "node:assert/strict";
import test from "node:test";
import {
  sendStaffMessageAction,
  sendStaffMessageActionForTest,
} from "@/actions/staff-message.action";

test("rejects staff replies for invalid session ids", async () => {
  const result = await sendStaffMessageAction(0, "Hello table 4");

  assert.deepEqual(result, { success: false, error: "Invalid session." });
});

test("rejects empty staff replies before checking authentication", async () => {
  const result = await sendStaffMessageAction(12, "   ");

  assert.deepEqual(result, { success: false, error: "Message is required." });
});

test("prevents staff from replying to a session owned by another restaurant", async () => {
  let createWasCalled = false;
  const result = await sendStaffMessageActionForTest(
    {
      getCurrentStaffUser: async () => ({ restaurantId: 1 }),
      findOwnedSession: async () => null,
      createMessage: async () => {
        createWasCalled = true;
        throw new Error("must not create");
      },
      isDatabaseUnavailable: () => false,
      revalidatePath: () => undefined,
    },
    12,
    "Hello table 4",
  );

  assert.deepEqual(result, { success: false, error: "Session not found." });
  assert.equal(createWasCalled, false);
});

test("stores a trimmed staff reply only after restaurant ownership is verified", async () => {
  const revalidated: string[] = [];
  const result = await sendStaffMessageActionForTest(
    {
      getCurrentStaffUser: async () => ({ restaurantId: 7 }),
      findOwnedSession: async ({ id, restaurantId }) =>
        id === 12 && restaurantId === 7 ? { id } : null,
      createMessage: async ({ sessionId, messageContent }) => ({
        id: 99,
        senderType: "staff",
        messageContent,
        createdAt: new Date("2026-07-17T10:00:00.000Z"),
        sessionId,
      }),
      isDatabaseUnavailable: () => false,
      revalidatePath: (path) => revalidated.push(path),
    },
    12,
    "  Your water is coming.  ",
  );

  assert.equal(result.success, true);
  assert.equal(result.message?.messageContent, "Your water is coming.");
  assert.deepEqual(revalidated, ["/sessions/12", "/sessions", "/dashboard"]);
});
