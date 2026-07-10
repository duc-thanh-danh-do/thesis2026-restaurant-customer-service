import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "node:crypto";
import path from "path";
import { getCurrentStaffUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http-errors";
import {
  assertCanUploadImages,
  sanitizeUploadedFileName,
  validateImageUploadFile,
} from "@/lib/uploads/image-upload";

export async function POST(request: Request) {
  try {
    assertCanUploadImages(await getCurrentStaffUser());
    const data = await request.formData();
    const file = data.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    await validateImageUploadFile(file);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const uniqueName = `${randomUUID()}-${sanitizeUploadedFileName(file.name)}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return toErrorResponse(error);
  }
}
