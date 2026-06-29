import StaffSidebar from "@/components/navigation/StaffSidebar";
import StaffTopbar from "@/components/staff/StaffTopbar";
import { requireStaffUser } from "@/lib/auth";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser();

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
