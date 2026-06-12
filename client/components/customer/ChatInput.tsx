import type { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isStartingSession: boolean;
  isSending: boolean;
  isDisabled: boolean;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isStartingSession,
  isSending,
  isDisabled,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-20 rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            isStartingSession ? "Starting session..." : "Ask about the menu..."
          }
          rows={1}
          disabled={isDisabled}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-0 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isDisabled || value.trim().length === 0}
          className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </form>
  );
}