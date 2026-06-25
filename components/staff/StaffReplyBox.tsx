"use client";

import type React from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StaffReplyBoxProps {
  onSendMessage?: (text: string) => void;
}

export default function StaffReplyBox({ onSendMessage }: StaffReplyBoxProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    onSendMessage?.(trimmedMessage);
    setMessage("");
  };

  return (
    <form className="flex shrink-0 gap-2 border-t border-slate-100 bg-white px-4 py-3" onSubmit={handleSubmit}>
      <Input
        className="border-slate-200 bg-slate-50"
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Reply to the guest..."
        value={message}
      />
      <Button
        className="bg-[#142653] text-white hover:bg-[#1d3670]"
        size="icon"
        type="submit"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </Button>
    </form>
  );
}
