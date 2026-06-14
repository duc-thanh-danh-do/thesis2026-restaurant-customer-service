import Link from "next/link";
import QRLandingCard from "@/components/customer/QRLandingCard";

export default async function TableLandingPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;

  return (
    <main className="flex min-h-screen w-full flex-col justify-center px-4 py-8">
      <QRLandingCard qrToken={qrToken} />
      <Link
        className="mt-4 rounded-md bg-neutral-950 px-4 py-3 text-center text-sm font-semibold text-white"
        href={`/table/${qrToken}/start`}
      >
        Start table session
      </Link>
    </main>
  );
}
