import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCanUploadImages,
  sanitizeUploadedFileName,
  validateImageUploadFile,
} from "@/lib/uploads/image-upload";

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

test("allows only restaurant administrators to upload public images", () => {
  assert.throws(
    () => assertCanUploadImages(null),
    (error: unknown) =>
      error instanceof Error && error.message === "Staff sign in is required",
  );
  assert.throws(
    () => assertCanUploadImages({ role: "staff" }),
    (error: unknown) =>
      error instanceof Error && error.message === "Administrator access is required",
  );
  assert.doesNotThrow(() => assertCanUploadImages({ role: "admin" }));
});

test("sanitizes uploaded image names without retaining path traversal", () => {
  assert.equal(
    sanitizeUploadedFileName("../../Menu Photo (Summer).PNG"),
    "menu-photo-summer.png",
  );
  assert.equal(sanitizeUploadedFileName("..."), "image");
});

test("accepts a small image whose bytes match its declared type", async () => {
  const file = new File([PNG_SIGNATURE], "dish.png", { type: "image/png" });
  await assert.doesNotReject(() => validateImageUploadFile(file));
});

test("rejects unsupported, oversized, and MIME-spoofed image uploads", async () => {
  await assert.rejects(
    () => validateImageUploadFile(new File(["hello"], "dish.txt", { type: "text/plain" })),
    /PNG, JPEG, or WebP/,
  );
  await assert.rejects(
    () =>
      validateImageUploadFile(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "dish.png", {
          type: "image/png",
        }),
      ),
    /5 MB or smaller/,
  );
  await assert.rejects(
    () => validateImageUploadFile(new File(["not a png"], "dish.png", { type: "image/png" })),
    /does not match/,
  );
});
