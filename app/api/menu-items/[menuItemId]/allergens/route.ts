export async function GET(
  _request: Request,
  { params }: { params: Promise<{ menuItemId: string }> },
) {
  const { menuItemId } = await params;
  return Response.json({ menuItemId, allergens: [] });
}
