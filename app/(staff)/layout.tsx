import StaffSidebar from "@/components/navigation/StaffSidebar";
import StaffTopbar from "@/components/staff/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <StaffSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopbar />
        {children}
      </div>
    </div>
  );
}
