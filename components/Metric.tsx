export default function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
