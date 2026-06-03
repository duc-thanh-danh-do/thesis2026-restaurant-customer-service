// client/components/staff/OrderPanel.tsx
export default function OrderPanel() {
    return (
      <div className="w-[400px] h-full bg-slate-50 border-l border-slate-200 overflow-y-auto p-6 flex flex-col gap-6">
        
        {/* Order Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Orders</h3>
          
          {/* Order Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">
                #A2 <span className="text-xs font-normal text-slate-400 ml-1">· 1h ago</span>
              </span>
              <span className="font-bold text-slate-800 text-sm">€32.00</span>
            </div>
  
            {/* Status */}
            <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">✓</span> Placed
              </div>
              <div className="h-[2px] bg-blue-600 flex-1 mx-1"></div>
              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">✓</span> Preparing
              </div>
              <div className="h-[2px] bg-slate-200 flex-1 mx-1"></div>
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">3</span> Ready
              </div>
              <div className="h-[2px] bg-slate-200 flex-1 mx-1"></div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px]">4</span> Served
              </div>
            </div>
  
            {/* Status Buttons */}
            <div className="flex gap-1.5 text-xs">
              <button type="button" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Placed</button>
              <button type="button" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Preparing</button>
              <button type="button" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold transition">Ready</button>
              <button type="button" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Served</button>
            </div>
  
            {/* Order Details */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs mt-1 border border-slate-100">
              <span className="text-slate-700 font-medium">2x Spicy Tomato Orecchiette</span>
              <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-md px-1.5 py-0.5">
                <button type="button" className="text-slate-400 hover:text-slate-600 font-bold px-0.5">-</button>
                <span className="text-slate-700 font-bold text-[11px]">2</span>
                <button type="button" className="text-slate-400 hover:text-slate-600 font-bold px-0.5">+</button>
              </div>
            </div>
          </div>
        </div>
  
        {/* Request Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Service requests</h3>
          
          {/* Request Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Allergen check: peanut</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">35 min ago</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 border border-blue-100">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span> In progress
              </span>
            </div>
  
            {/* Status Button */}
            <div className="flex gap-1.5 text-xs">
              <button type="button" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Waiting</button>
              <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold transition">In progress</button>
              <button type="button" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Resolved</button>
            </div>
          </div>
        </div>
  
      </div>
    );
  }