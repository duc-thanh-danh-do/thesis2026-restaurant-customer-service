import QRCodeCard from "@/components/qr/QRCodeCard";

export default function TablesPage() {
  return (
    <main className="grid gap-4 p-6 md:grid-cols-2">
      <QRCodeCard tableNumber="1" qrToken="testpizza-table-1" />
      <QRCodeCard tableNumber="2" qrToken="testpizza-table-2" />
    </main>
  );
}
