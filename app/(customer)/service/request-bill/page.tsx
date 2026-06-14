import ServiceRequestButton from "@/components/customer/ServiceRequestButton";

export default function RequestBillPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <ServiceRequestButton label="Request bill" requestType="bill" />
    </main>
  );
}
