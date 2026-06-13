export async function GET(
  _request: Request,
  { params }: { params: Promise<{ allergenId: string }> },
) {
  const { allergenId } = await params;
  return Response.json({ allergenId });
}
