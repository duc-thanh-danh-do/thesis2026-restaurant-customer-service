import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json(
      { message: error.message, code: error.code },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      { message: "Invalid request data.", code: "VALIDATION_ERROR", issues: error.issues },
      { status: 400 },
    );
  }

  console.error("Unexpected request error", error);
  return Response.json(
    { message: "An unexpected server error occurred.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
