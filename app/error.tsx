"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="surface max-w-md p-8">
        <p className="text-sm font-semibold uppercase text-red-700">Error</p>
        <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">{error.message}</p>
        <button
          className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
