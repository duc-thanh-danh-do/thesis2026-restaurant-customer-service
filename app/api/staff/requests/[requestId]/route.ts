export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  return Response.json({ requestId, message: "Request status update scaffolded." }, { status: 501 });
}
