"use client";

import { useState, useCallback } from "react";

export function useToast(duration = 2000) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setTimeout(() => {
        setToastMessage(null);
      }, duration);
    },
    [duration]
  );

  return { toastMessage, showToast };
}

export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#142653] text-white text-sm px-5 py-2.5 rounded-full shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 z-[100]">
      {message}
    </div>
  );
}
