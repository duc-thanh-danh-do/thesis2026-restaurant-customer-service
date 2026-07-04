"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createRestaurantTableAction, type CreateTableState } from "@/actions/restaurant-table.action";

const initialState: CreateTableState = { success: false };

export default function TableCreateForm() {
  const [state, formAction, isPending] = useActionState(createRestaurantTableAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Table setup</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Create new table</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a restaurant table and generate a unique customer QR route for it.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Table number or name</span>
          <input
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            maxLength={50}
            name="tableNumber"
            placeholder="Example: 12, Patio 3, VIP 1"
            required
          />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            className="size-4 rounded border-slate-300 text-blue-600"
            defaultChecked
            name="isActive"
            type="checkbox"
            value="true"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Active QR code</span>
            <span className="block text-xs text-slate-500">Guests can start sessions from this table immediately.</span>
          </span>
        </label>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#13275a] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Create table
        </button>
      </div>
    </form>
  );
}
