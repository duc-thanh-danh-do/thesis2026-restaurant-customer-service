"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StaffReplyBoxProps {
  onSendMessage?: (text: string) => Promise<{ success: boolean; error?: string } | void> | { success: boolean; error?: string } | void;
}

export default function StaffReplyBox({ onSendMessage }: StaffReplyBoxProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setError(null);
    setMessage("");
    startTransition(async () => {
      const result = await onSendMessage?.(trimmedMessage);

      if (result && !result.success) {
        setError(result.error ?? "Unable to send message.");
        setMessage(trimmedMessage);
        return;
      }
    });
  };

  return (
    <form className="shrink-0 border-t border-slate-100 bg-white px-4 py-3" onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <Input
          className="border-slate-200 bg-slate-50"
          disabled={isPending}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Reply to the guest..."
          value={message}
        />
        <Button
          className="bg-[#142653] text-white hover:bg-[#1d3670]"
          disabled={isPending}
          size="icon"
          type="submit"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </form>
  );
}
