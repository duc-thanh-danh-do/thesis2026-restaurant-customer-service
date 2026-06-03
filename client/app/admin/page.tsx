// client/app/admin/page.tsx
import ChatBoard from '@/components/staff/ChatBoard';
import OrderPanel from '@/components/staff/OrderPanel';

export default function AdminDashboard() {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Bistro Aurora
          </p>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Table 7</h2>
          <p className="text-xs text-slate-400 mt-0.5">Last update 35 min ago</p>
        </div>
        <button 
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 text-xs"
        >

          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Mark all resolved
        </button>
      </div>


      <div className="flex-1 flex overflow-hidden">
        {/* ChatBoard */}
        <ChatBoard />

        {/* Order Details Panel */}
        <OrderPanel />
      </div>

    </div>
  );
}