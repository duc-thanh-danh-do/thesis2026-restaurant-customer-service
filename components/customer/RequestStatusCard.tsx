import StatusBadge from "@/components/StatusBadge";

export default function RequestStatusCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <article className="surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <StatusBadge status={status} />
      </div>
    </article>
  );
}
