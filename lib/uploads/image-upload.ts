import { HttpError } from "@/lib/http-errors";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function assertCanUploadImages(
  staffUser: { role: string | null } | null | undefined,
) {
  if (!staffUser) {
    throw new HttpError("Staff sign in is required", "AUTH_REQUIRED", 401);
  }
  if (staffUser.role !== "admin") {
    throw new HttpError(
      "Administrator access is required",
      "ADMIN_REQUIRED",
      403,
    );
  }
}

export function sanitizeUploadedFileName(fileName: string) {
  const leafName = fileName.split(/[\\/]/).pop() ?? "";
  const lastDot = leafName.lastIndexOf(".");
  const rawBase = lastDot > 0 ? leafName.slice(0, lastDot) : leafName;
  const rawExtension = lastDot > 0 ? leafName.slice(lastDot).toLowerCase() : "";
  const extension = [".png", ".jpg", ".jpeg", ".webp"].includes(rawExtension)
    ? rawExtension
    : "";
  const base = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "image"}${extension}`;
}

export async function validateImageUploadFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new HttpError(
      "Image must be PNG, JPEG, or WebP.",
      "IMAGE_TYPE_UNSUPPORTED",
      400,
    );
  }
  if (file.size === 0) {
    throw new HttpError("Image file is empty.", "IMAGE_EMPTY", 400);
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new HttpError(
      "Image must be 5 MB or smaller.",
      "IMAGE_TOO_LARGE",
      413,
    );
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasExpectedSignature(file.type, header)) {
    throw new HttpError(
      "Image content does not match its declared file type.",
      "IMAGE_SIGNATURE_INVALID",
      400,
    );
  }
}

function hasExpectedSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") {
    return startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10]);
  }
  if (type === "image/jpeg") {
    return startsWith(bytes, [255, 216, 255]);
  }
  if (type === "image/webp") {
    return (
      startsWith(bytes, [82, 73, 70, 70]) &&
      bytes.length >= 12 &&
      bytes[8] === 87 &&
      bytes[9] === 69 &&
      bytes[10] === 66 &&
      bytes[11] === 80
    );
  }
  return false;
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}
