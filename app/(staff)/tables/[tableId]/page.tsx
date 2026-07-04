import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { getStaffTableDetail } from "@/lib/staff-page-data";
import { buildCustomerTableUrl, getAppBaseUrlFromHeaders } from "@/lib/table-url";

export const dynamic = "force-dynamic";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const table = await getStaffTableDetail(Number(tableId));

  if (!table) notFound();

  const qrPath = `/table/${encodeURIComponent(table.qrCodeToken)}`;
  const customerTableUrl = buildCustomerTableUrl(
    table.qrCodeToken,
    getAppBaseUrlFromHeaders(await headers()),
  );
  const qrDataUrl = await QRCode.toDataURL(customerTableUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex flex-col gap-3">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" href="/tables">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tables
        </Link>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Table workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Table {table.tableNumber}</h1>
            <p className="mt-1 text-slate-600">QR entry, session history, and service health for this restaurant table.</p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
              table.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {table.isActive ? "Active QR code" : "Inactive table"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
            <Image
              alt={`QR code for Table ${table.tableNumber}`}
              className="size-full max-h-72 max-w-72 object-contain"
              height={288}
              unoptimized
              src={qrDataUrl}
              width={288}
            />
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Customer entry route</p>
            <p className="mt-1 break-all font-medium text-slate-950">{customerTableUrl}</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#142653] px-3 text-sm font-semibold !text-white hover:bg-[#13275a]"
              download={`table-${table.tableNumber}-qr.png`}
              href={qrDataUrl}
            >
              <Download className="size-4" aria-hidden="true" />
              Download QR
            </a>
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={qrPath}
              target="_blank"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open link
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Total sessions" value={table.totalSessions} />
            <Stat label="Live sessions" value={table.activeSessions} />
            <Stat label="Pending requests" value={table.pendingRequests} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Operational notes</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p className="rounded-lg bg-slate-50 p-3">
                Use this table route on printed QR material so guests land on the correct restaurant and table.
              </p>
              <p className="rounded-lg bg-slate-50 p-3">
                Open sessions and unresolved service requests are surfaced here before the floor team responds.
              </p>
              <p className="rounded-lg bg-slate-50 p-3">
                The QR image and link use the current deployment domain when this page is opened in production.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
