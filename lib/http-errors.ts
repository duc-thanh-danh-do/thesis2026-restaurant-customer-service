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

  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ message, code: "INTERNAL_ERROR" }, { status: 500 });
}
