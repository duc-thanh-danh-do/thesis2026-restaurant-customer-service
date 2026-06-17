import ServiceRequestButton from "@/components/customer/ServiceRequestButton";

export default function CallStaffPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <ServiceRequestButton label="Call staff" requestType="staff_help" />
    </main>
  );
}
