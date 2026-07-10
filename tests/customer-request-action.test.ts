import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveRequestsActionForTest,
  updateRequestStatusForTest,
} from "@/actions/customer-request.action";

test("staff request queues are scoped to the signed-in restaurant", async () => {
  let queriedRestaurantId: number | undefined;
  const result = await getActiveRequestsActionForTest({
    getCurrentStaffUser: async () => ({ restaurantId: 7 }),
    findActiveRequests: async (restaurantId) => {
      queriedRestaurantId = restaurantId;
      return [{ id: 22 }];
    },
  });

  assert.equal(queriedRestaurantId, 7);
  assert.deepEqual(result, [{ id: 22 }]);
});

test("staff cannot update a request owned by another restaurant", async () => {
  const result = await updateRequestStatusForTest(
    {
      getCurrentStaffUser: async () => ({ restaurantId: 7 }),
      updateOwnedRequest: async () => 0,
    },
    99,
    "Resolved",
  );

  assert.deepEqual(result, { success: false, error: "Request not found." });
});

test("request updates reject unsupported status values", async () => {
  let updateWasCalled = false;
  const result = await updateRequestStatusForTest(
    {
      getCurrentStaffUser: async () => ({ restaurantId: 7 }),
      updateOwnedRequest: async () => {
        updateWasCalled = true;
        return 1;
      },
    },
    99,
    "Deleted",
  );

  assert.equal(updateWasCalled, false);
  assert.deepEqual(result, { success: false, error: "Invalid request status." });
});
