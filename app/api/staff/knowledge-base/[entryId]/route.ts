export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return Response.json({ entryId });
}
