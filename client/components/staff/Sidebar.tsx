// client/components/admin/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    // 外框：固定宽度 72，高度满屏，暗蓝色背景 (bg-slate-900)，文字白色
    <aside className="w-72 h-screen bg-slate-900 text-white flex flex-col p-6 overflow-y-auto">
      {/* 1. 顶部：标题和餐厅名字 */}
      <div className="mb-8 mt-2">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          Staff Dashboard
        </h2>
        <h1 className="text-2xl font-bold text-white">Bistro Aurora</h1>
      </div>

      {/* 2. 状态概览区域 (ACTIVE) */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 text-sm font-medium">
          {/* Need attention 提示 */}
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>2 Need
            attention
          </div>
          {/* Open orders 提示 */}
          <div className="flex items-center gap-2 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>3 Open
            orders
          </div>
        </div>
      </div>

      {/* 3. Menu Admin 按钮 */}
      <Link
        href="/admin/menu"
        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex items-center gap-3 mb-8 transition border border-slate-700"
      >
        {/* 这是一个简单的网格小图标 */}
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

      {/* 4. 桌号列表区域 */}
      <div className="flex flex-col gap-2">
        {/* 桌子 4：选中状态，带红色左边框 */}
        <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-red-500 cursor-pointer">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white">Table 4</span>
            <span className="text-xs text-slate-400">2m ago</span>
          </div>
          <div className="text-sm text-red-400">Need attention</div>
        </div>

        {/* 桌子 7：未选中，红色提示 */}
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

        {/* 桌子 2：未选中，蓝色提示 */}
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
