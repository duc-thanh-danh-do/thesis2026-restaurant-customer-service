export default async function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ menuItemId: string }>;
}) {
  const { menuItemId } = await params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-slate-950">Menu item {menuItemId}</h1>
      <p className="mt-2 text-sm text-slate-600">Use the menu admin workspace to review and edit dishes.</p>
    </main>
  );
}
