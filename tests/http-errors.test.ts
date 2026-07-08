import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { HttpError, toErrorResponse } from "@/lib/http-errors";

test("serializes domain HTTP errors with their status code", async () => {
  const response = toErrorResponse(new HttpError("Not found", "NOT_FOUND", 404));
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, { message: "Not found", code: "NOT_FOUND" });
});

test("serializes validation errors as client errors", async () => {
  const error = z.object({ name: z.string().min(1) }).safeParse({ name: "" }).error;
  assert.ok(error);

  const response = toErrorResponse(error);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.equal(Array.isArray(body.issues), true);
});
