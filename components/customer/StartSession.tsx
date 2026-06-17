"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StartSession({ qrToken }: { qrToken: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function start() {
      try {
        const response = await fetch("/api/customer-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCodeToken: qrToken }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { message?: string };
          throw new Error(payload.message ?? "Failed to start session");
        }

        const payload = (await response.json()) as { sessionToken: string };
        window.localStorage.setItem("dining-session-token", payload.sessionToken);
        router.replace(`/session/${payload.sessionToken}`);
      } catch (sessionError) {
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Failed to start session",
        );
      }
    }

    start();
  }, [qrToken, router]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="surface w-full p-6">
        <h1 className="text-2xl font-bold">Starting session</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Please wait while we connect this table.
        </p>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
