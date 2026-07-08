import MenuBrowser from "@/components/customer/MenuBrowser";

export default function CustomerMenuPage() {
  return (
    <main className="h-full overflow-y-auto px-4 py-6">
      <MenuBrowser restaurantId={1} />
    </main>
  );
}
