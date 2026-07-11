import assert from "node:assert/strict";
import test from "node:test";
import { generateAiTextWithDependencies } from "@/services/ai-assistant.service";

test("returns a safe staff fallback without calling an AI provider when unconfigured", async () => {
  let callCount = 0;
  const reply = await generateAiTextWithDependencies("hello", {
    apiKey: "",
    model: "test-model",
    generateContent: async () => {
      callCount += 1;
      return { text: "unexpected" };
    },
    wait: async () => undefined,
  });

  assert.match(reply, /not configured/i);
  assert.equal(callCount, 0);
});

test("retries transient AI failures with bounded incremental backoff", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const reply = await generateAiTextWithDependencies("hello", {
    apiKey: "test-key",
    model: "test-model",
    generateContent: async ({ model, contents }) => {
      attempts += 1;
      assert.equal(model, "test-model");
      assert.equal(contents, "hello");
      if (attempts < 3) throw new Error("temporary provider failure");
      return { text: "Recovered response" };
    },
    wait: async (milliseconds) => {
      waits.push(milliseconds);
    },
  });

  assert.equal(reply, "Recovered response");
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [500, 1000]);
});

test("stops after the configured AI attempt limit and preserves the provider error", async () => {
  let attempts = 0;
  const providerError = new Error("provider unavailable");

  await assert.rejects(
    () =>
      generateAiTextWithDependencies("hello", {
        apiKey: "test-key",
        model: "test-model",
        maxAttempts: 2,
        generateContent: async () => {
          attempts += 1;
          throw providerError;
        },
        wait: async () => undefined,
      }),
    (error: unknown) => error === providerError,
  );
  assert.equal(attempts, 2);
});
