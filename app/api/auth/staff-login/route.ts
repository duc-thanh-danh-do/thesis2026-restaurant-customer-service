export async function POST() {
  return Response.json(
    {
      message: "Staff authentication is scaffolded for the Next.js BFF rebuild.",
      code: "STAFF_AUTH_NOT_IMPLEMENTED",
    },
    { status: 501 },
  );
}
