export default function StaffReplyBox() {
  return (
    <form className="mt-4 flex gap-2">
      <input className="flex-1 rounded-md border px-3 py-2 text-sm" placeholder="Reply as staff" />
      <button className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white" type="button">
        Send
      </button>
    </form>
  );
}
