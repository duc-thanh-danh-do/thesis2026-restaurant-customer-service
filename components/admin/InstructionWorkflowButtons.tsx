"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";

async function postInstructionRelease(
  endpoint: "publish" | "rollback",
  body: Record<string, number>,
) {
  const response = await fetch(`/api/admin/instructions/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Instruction ${endpoint} failed.`);
  }
}

export function PublishInstructionButton({ id, version }: { id: number; version: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          setError("");
          try {
            await postInstructionRelease("publish", { instructionId: id });
            router.push("/admin/instructions?published=1");
            router.refresh();
          } catch {
            setError("Publishing failed. Refresh and try again.");
          }
        })}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#142653] px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isPending ? "Publishing..." : `Publish version v${version}`}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function RollbackInstructionButton({ targetId, version }: { targetId: number; version: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="mt-4 text-right sm:mt-0">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          setError("");
          try {
            await postInstructionRelease("rollback", { targetId });
            router.push("/admin/monitoring?rolledBack=1");
            router.refresh();
          } catch {
            setError("Rollback failed. Refresh and try again.");
          }
        })}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#142653] disabled:opacity-60"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        {isPending ? "Rolling back..." : `Roll back to v${version}`}
      </button>
      {error ? <p className="mt-2 text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
