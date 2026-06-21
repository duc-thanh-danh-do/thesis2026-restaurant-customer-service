import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerTableCart from "./CustomerTableCart";

export const dynamic = "force-dynamic";

export type CustomerCartMenuItem = {
  id: string;
  name: string;
  price: number;
};

export default async function CartPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const table = await prisma.restaurantTable.findUnique({
    where: { qrCodeToken: qrToken },
    include: {
      restaurant: {
        include: {
          menuItems: {
            where: { isAvailable: true },
            select: {
              id: true,
              name: true,
              price: true,
            },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  if (!table) notFound();

  const menuItems: CustomerCartMenuItem[] = table.restaurant.menuItems.map((item) => ({
    id: String(item.id),
    name: item.name,
    price: Number(item.price),
  }));

  return <CustomerTableCart menuItems={menuItems} />;
}
