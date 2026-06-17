export default function QRLandingCard({ qrToken }: { qrToken: string }) {
  return (
    <section className="surface p-6">
      <p className="text-sm font-semibold uppercase text-teal-700">Welcome to</p>
      <h1 className="mt-1 text-3xl font-bold">TestPizza</h1>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        Confirm your table session, browse the menu, and ask the assistant about
        ingredients, allergens, opening hours, or payment options.
      </p>
      <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        QR token: {qrToken}
      </p>
    </section>
  );
}
