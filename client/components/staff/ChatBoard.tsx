// client/components/staff/ChatBoard.tsx
export default function ChatBoard() {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        
        {/* 1. Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Client's message */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm shrink-0">U</div>
            <div>
              <p className="text-xs text-slate-400 mb-1">You · 36 min ago</p>
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl rounded-tl-none max-w-md text-sm">
                Is the pesto pasta safe for a peanut allergy?
              </div>
            </div>
          </div>
  
          {/* AI Messages */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">AI</div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Assistant · 35 min ago</p>
              <div className="bg-slate-100 text-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-md text-sm">
              {"I've"} forwarded this to a staff member to confirm.
              </div>
            </div>
          </div>
        </div>
  
        {/* 2. Input Area */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Reply to the guest..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              title="Send reply"
              aria-label="Send reply"
              className="absolute right-3 top-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
  
      </div>
    );
  }