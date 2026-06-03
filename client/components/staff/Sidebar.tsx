// client/components/staff/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (

    <aside className="w-72 h-screen bg-[#0f2147] text-white flex flex-col p-6 overflow-y-auto shrink-0">
      
      {/* Header */}
      <div className="mb-8 mt-2">
        <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>
          </svg>
          Staff Dashboard
        </h2>
        <h1 className="text-2xl font-bold text-white tracking-tight">Bistro Aurora</h1>
        <p className="text-slate-400 text-xs mt-1">2 need attention · 2 open orders</p>
      </div>

      {/* 2. Menu Admin */}
      <Link
        href="/admin/menu"
        className="w-full bg-[#1e2f55] hover:bg-[#283b66] text-white py-2.5 px-4 rounded-xl flex items-center gap-3 mb-8 transition border border-slate-700/30 text-sm font-medium"
      >
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Menu admin</span>
      </Link>

      {/* Table Card*/}
      <div className="flex flex-col gap-3">
        
        {/* Table 4, selected with red waiting warning */}
        <div className="p-4 bg-[#1a2c54] rounded-2xl border border-slate-700/20 shadow-lg cursor-pointer">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-base flex items-center gap-1.5">
              Table 4 
              <span className="text-red-500 font-bold text-sm">⚠️</span>
            </span>
            <span className="text-xs text-slate-400">just now</span>
          </div>
          {/* Display Status */}
          <div className="flex gap-1.5 mt-3">
            <span className="px-2.5 py-1 bg-red-500/20 text-red-500 rounded-lg text-[11px] font-bold flex items-center gap-1">
              🕒 Waiting
            </span>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[11px] font-semibold flex items-center gap-1">
              📋 #A1 · Preparing
            </span>
          </div>
        </div>

        {/* Table 7 unselected */}
        <div className="p-4 hover:bg-[#152549] rounded-2xl cursor-pointer transition flex flex-col">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200 text-base flex items-center gap-1.5">
              Table 7
            </span>
            <span className="text-xs text-slate-400">25 min ago</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1">
              🔄 In progress
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px] font-semibold flex items-center gap-1">
              📋 #A2 · Ready
            </span>
          </div>
        </div>

        {/* Table 12, resolved */}
        <div className="p-4 hover:bg-[#152549] rounded-2xl cursor-pointer transition">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200 text-base">Table 12</span>
            <span className="text-xs text-slate-400">3h ago</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1">
              ✓ Resolved
            </span>
          </div>
        </div>

        {/* Table 2 open order */}
        <div className="p-4 hover:bg-[#152549] rounded-2xl cursor-pointer transition">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200 text-base">Table 2</span>
            <span className="text-xs text-slate-400">3h ago</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px] font-semibold flex items-center gap-1">
              📋 Open order
            </span>
          </div>
        </div>

      </div>
    </aside>
  );
}