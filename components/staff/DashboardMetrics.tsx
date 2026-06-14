import Metric from "@/components/Metric";

export default function DashboardMetrics() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Metric label="Active sessions" value="2" />
      <Metric label="Pending requests" value="1" />
      <Metric label="Menu items" value="5" />
    </section>
  );
}
