import assert from "node:assert/strict";
import test from "node:test";
import { POST as postCustomerSession } from "@/app/api/customer-sessions/route";
import { POST as postMenuItem } from "@/app/api/menu-items/route";
import { GET as getStaffRequests } from "@/app/api/staff/requests/route";
import { GET as getStaffSessions } from "@/app/api/staff/sessions/route";

test("staff sessions API returns the scaffolded collection shape", async () => {
  const response = await getStaffSessions();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { sessions: [] });
});

test("staff requests API returns the scaffolded collection shape", async () => {
  const response = await getStaffRequests();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { requests: [] });
});

test("menu item mutation API reports unfinished server support clearly", async () => {
  const response = await postMenuItem();
  const body = await response.json();

  assert.equal(response.status, 501);
  assert.deepEqual(body, { message: "Menu item mutation is scaffolded." });
});

test("customer session API rejects invalid payloads before service work", async () => {
  const request = new Request("http://localhost/api/customer-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  const response = await postCustomerSession(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
});
