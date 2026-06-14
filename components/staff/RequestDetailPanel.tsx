export default function RequestDetailPanel({ requestId }: { requestId: string }) {
  return (
    <section className="surface p-4">
      <h1 className="text-xl font-bold">Request {requestId}</h1>
      <p className="mt-2 text-sm text-neutral-600">Status update panel scaffold.</p>
    </section>
  );
}
