export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return Response.json({ sessionId, message: "Staff reply scaffolded." }, { status: 501 });
}
