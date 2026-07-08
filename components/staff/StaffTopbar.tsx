import { signOutStaffAction } from "@/actions/auth.action";

export default function StaffTopbar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      {/* <p className="text-xs font-semibold uppercase text-slate-500">Bistro operations</p> */}
      <h1 className="text-xl font-bold text-slate-900">Staff workspace</h1>
      <form action={signOutStaffAction}>
        <button
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
