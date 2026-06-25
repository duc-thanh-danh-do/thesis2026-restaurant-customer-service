import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerTableChat from "./CustomerTableChat";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const table = await prisma.restaurantTable.findUnique({
    where: { qrCodeToken: qrToken },
    include: {
      restaurant: true,
    },
  });

  if (!table) notFound();

  return (
    <CustomerTableChat
      qrToken={qrToken}
      restaurantName={table.restaurant.name}
      tableNumber={table.tableNumber}
    />
  );
}
