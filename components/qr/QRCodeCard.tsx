export default function QRCodeCard({
  tableNumber,
  qrToken,
}: {
  tableNumber: string;
  qrToken: string;
}) {
  return (
    <section className="surface p-4">
      <h2 className="font-semibold">Table {tableNumber}</h2>
      <p className="mt-2 text-sm text-neutral-600">/table/{qrToken}</p>
    </section>
  );
}
