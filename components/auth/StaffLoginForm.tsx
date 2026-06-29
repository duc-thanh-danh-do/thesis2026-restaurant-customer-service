"use client";

import { useActionState } from "react";
import { signInStaffAction, type StaffSignInState } from "@/actions/auth.action";

const initialState: StaffSignInState = {
  success: false,
};

export default function StaffLoginForm() {
  const [state, formAction, isPending] = useActionState(signInStaffAction, initialState);

  return (
    <section className="surface w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold text-slate-950">Staff sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Use your staff account to open the operations workspace.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            autoComplete="email"
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
            name="email"
            required
            type="email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            autoComplete="current-password"
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
            name="password"
            required
            type="password"
          />
        </label>

        {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

        <button
          className="h-10 w-full rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white hover:bg-[#13275a] disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
