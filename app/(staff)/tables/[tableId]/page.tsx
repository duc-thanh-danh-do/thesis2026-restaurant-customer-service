import PrintableTableQRCode from "@/components/qr/PrintableTableQRCode";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  return (
    <main className="p-6">
      <PrintableTableQRCode tableId={tableId} />
    </main>
  );
}
