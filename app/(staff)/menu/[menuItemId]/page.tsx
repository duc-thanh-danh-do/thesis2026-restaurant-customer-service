import MenuItemForm from "@/components/menu/MenuItemForm";

export default async function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ menuItemId: string }>;
}) {
  const { menuItemId } = await params;
  return (
    <main className="p-6">
      <MenuItemForm title={`Menu item ${menuItemId}`} />
    </main>
  );
}
