import RequestStatusCard from "@/components/customer/RequestStatusCard";

export default function CustomerRequestsPage() {
  return (
    <main className="space-y-3 px-4 py-6">
      <h1 className="text-2xl font-bold">Requests</h1>
      <RequestStatusCard status="pending" title="No active staff request" />
    </main>
  );
}
