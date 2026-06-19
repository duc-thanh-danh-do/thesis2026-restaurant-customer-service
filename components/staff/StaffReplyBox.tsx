export default function StaffReplyBox() {
  return (
    <form className="flex gap-2">
      <input className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white" placeholder="Reply to the guest..." />
      <button className="rounded-lg bg-[#142653] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d3670]" type="button">
        Send
      </button>
    </form>
  );
}
