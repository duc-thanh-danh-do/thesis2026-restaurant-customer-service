"use client";

import type { FormEvent } from "react";
import { Send } from "lucide-react";

export default function CustomerChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled: boolean;
}) {
  return (
    <form className="sticky bottom-20 flex gap-2" onSubmit={onSubmit}>
      <input
        className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-700"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask about the menu..."
        value={value}
      />
      <button
        aria-label="Send message"
        className="grid size-12 place-items-center rounded-md bg-neutral-950 text-white disabled:opacity-50"
        disabled={disabled || value.trim().length === 0}
        type="submit"
      >
        <Send className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
