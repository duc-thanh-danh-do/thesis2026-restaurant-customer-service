import assert from "node:assert/strict";
import test from "node:test";
import { buildTableUrl } from "@/lib/qr";
import { isActiveSession } from "@/lib/session";
import { createToken } from "@/lib/tokens";

test("builds customer table URLs from QR tokens", () => {
  assert.equal(buildTableUrl("testpizza-table-4"), "/table/testpizza-table-4");
});

test("classifies active customer session statuses", () => {
  assert.equal(isActiveSession("active"), true);
  assert.equal(isActiveSession("waiting_staff"), true);
  assert.equal(isActiveSession("closed"), false);
  assert.equal(isActiveSession("cancelled"), false);
});

test("creates prefixed UUID tokens", () => {
  const firstToken = createToken("session");
  const secondToken = createToken("session");

  assert.match(
    firstToken,
    /^session_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.notEqual(firstToken, secondToken);
});
