export default function EmptyState({ title }: { title: string }) {
  return (
    <div className="surface p-6 text-center text-sm text-neutral-600">
      <p className="font-semibold text-neutral-900">{title}</p>
    </div>
  );
}
