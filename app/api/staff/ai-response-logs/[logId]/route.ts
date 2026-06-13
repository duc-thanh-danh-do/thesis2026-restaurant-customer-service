export async function GET(
  _request: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  const { logId } = await params;
  return Response.json({ logId });
}
