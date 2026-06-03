// client/app/admin/page.tsx
import ChatBoard from "@/components/staff/ChatBoard";

export default function AdminDashboard() {
  return (
    <main className="w-full h-full flex">
      <ChatBoard />

      <div className="w-96 bg-slate-50 p-6 flex flex-col items-center justify-center border-l border-slate-200">
        <p className="text-slate-400 font-medium">Table Status</p>
      </div>
    </main>
  );
}
