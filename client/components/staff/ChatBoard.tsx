// client/components/staff/ChatBoard.tsx

export default function ChatBoard() {
  return (
    <div className="flex-1 flex flex-col h-screen bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Bistro Aurora
          </p>
          <h2 className="text-2xl font-bold text-slate-800">Table 4</h2>
          <p className="text-sm text-slate-500 mt-1">Last update 2 min ago</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
          <span>✓</span> Mark all resolved
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* AI messages */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
            AI
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Assistant · 23 min ago
            </p>
            <div className="bg-slate-100 text-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-md">
              Welcome to Bistro Aurora, table 4. How can I help you today?
            </div>
          </div>
        </div>

        {/* Client's message */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold shrink-0">
            U
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Guest · 22 min ago</p>
            <div className="bg-slate-800 text-white p-3.5 rounded-2xl rounded-tl-none max-w-md">
              Which dishes are vegetarian and do not contain sesame?
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Reply to the guest..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* button */}
          <button
            type="button"
            title="Send reply"
            aria-label="Send reply"
            className="absolute right-3 top-3 p-1.5 bg-slate-300 text-slate-600 rounded-lg hover:bg-slate-400 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
