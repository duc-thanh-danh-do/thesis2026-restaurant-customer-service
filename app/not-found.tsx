import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="surface max-w-md p-8">
        <p className="text-sm font-semibold uppercase text-teal-700">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          This dining session or staff page is not available.
        </p>
        <Link className="mt-6 inline-block text-sm font-semibold text-teal-700" href="/">
          Return to table entry
        </Link>
      </section>
    </main>
  );
}
