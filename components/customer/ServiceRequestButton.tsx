"use client";

import { useState } from "react";

export default function ServiceRequestButton({
  label,
  requestType,
}: {
  label: string;
  requestType: string;
}) {
  const [status, setStatus] = useState("ready");

  return (
    <section className="surface w-full max-w-sm p-6 text-center">
      <h1 className="text-2xl font-bold">{label}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        This direct request surface is ready to connect to an active session.
      </p>
      <button
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
        type="button"
        onClick={() => setStatus(`queued ${requestType}`)}
      >
        Send request
      </button>
      <p className="mt-3 text-xs text-neutral-500">{status}</p>
    </section>
  );
}
