"use client";

import { useState } from "react";

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("dining-session-token");
}

export default function ServiceRequestButton({
  label,
  requestType,
}: {
  label: string;
  requestType: string;
}) {
  const [status, setStatus] = useState("ready");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      setStatus("No active session. Please scan a QR code first.");
      return;
    }

    setLoading(true);
    setStatus("Sending...");

    try {
      const res = await fetch(
        `/api/customer-sessions/${sessionToken}/requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType,
            description: label,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus(`Error: ${data.message || "Failed to send request"}`);
        return;
      }

      setStatus(`✓ ${label} — request sent!`);
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface w-full max-w-sm p-6 text-center">
      <h1 className="text-2xl font-bold">{label}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        This direct request surface is ready to connect to an active session.
      </p>
      <button
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        type="button"
        disabled={loading}
        onClick={handleSend}
      >
        {loading ? "Sending..." : "Send request"}
      </button>
      <p className="mt-3 text-xs text-neutral-500">{status}</p>
    </section>
  );
}
