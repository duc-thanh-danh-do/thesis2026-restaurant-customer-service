// client/components/admin/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-slate-900 text-white flex flex-col p-6 overflow-y-auto">
      {/* Topbar */}
      <div className="mb-8 mt-2">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          Staff Dashboard
        </h2>
        <h1 className="text-2xl font-bold text-white">Bistro Aurora</h1>
      </div>

      {/* 2. StatusBar */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 text-sm font-medium">
          {/* Need attention */}
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>2 Need
            attention
          </div>
          {/* Open orders*/}
          <div className="flex items-center gap-2 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>3 Open
            orders
          </div>
        </div>
      </div>

      {/*  Menu Admin */}
      <Link
        href="/admin/menu"
        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex items-center gap-3 mb-8 transition border border-slate-700"
      >

        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        <span className="font-semibold">Menu Admin</span>
      </Link>

      {/* 4. TableList */}
      <div className="flex flex-col gap-2">
        {/* Table 4, selected with red higlight */}
        <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-red-500 cursor-pointer">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white">Table 4</span>
            <span className="text-xs text-slate-400">2m ago</span>
          </div>
          <div className="text-sm text-red-400">Need attention</div>
        </div>

        {/* Table 7 Unselected without highlight */}
        <div className="p-4 hover:bg-slate-800 rounded-xl cursor-pointer transition">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-200">Table 7</span>
            <span className="text-xs text-slate-400">5m ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Need attention
          </div>
        </div>

        {/* Table 2, no attention with color blue */}
        <div className="p-4 hover:bg-slate-800 rounded-xl cursor-pointer transition">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-200">Table 2</span>
            <span className="text-xs text-slate-400">12m ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Open order
          </div>
        </div>
      </div>
    </aside>
  );
}
