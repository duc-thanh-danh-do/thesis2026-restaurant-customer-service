import Sidebar from '@/components/staff/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white">
      
      <Sidebar />

      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {children}
      </div>

    </div>
  );
}