export default function MenuItemForm({ title }: { title: string }) {
  return (
    <section className="surface max-w-2xl p-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-600">Menu item form scaffold.</p>
    </section>
  );
}
