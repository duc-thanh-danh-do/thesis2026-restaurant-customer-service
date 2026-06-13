export async function GET(
  _request: Request,
  { params }: { params: Promise<{ menuItemId: string }> },
) {
  const { menuItemId } = await params;
  return Response.json({ menuItemId });
}

export async function PATCH() {
  return Response.json({ message: "Menu item mutation is scaffolded." }, { status: 501 });
}

export async function DELETE() {
  return Response.json({ message: "Menu item mutation is scaffolded." }, { status: 501 });
}
