"use client";

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
    if (!message.trim()) return;
    
    if (onSendMessage) {
      onSendMessage(message);
    }
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white px-4 py-3 border-t border-slate-100 flex-shrink-0 flex gap-2">
      <Input
        placeholder="Reply to the guest..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="bg-slate-50 border-slate-200"
      />
      <Button 
        size="icon" 
        type="submit"
        className="bg-slate-200 hover:bg-slate-300 text-slate-600"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </form>
  );
}