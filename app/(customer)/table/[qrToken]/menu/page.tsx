import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerTableMenu from "./CustomerTableMenu";

export const dynamic = "force-dynamic";

export type CustomerMenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  dietary: string[];
  allergens: string[];
};

export default async function MenuPage({
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
              description: true,
              category: true,
              dietary: true,
              menuItemAllergens: {
                include: {
                  allergen: true,
                },
              },
            },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  if (!table) notFound();

  const menuItems: CustomerMenuItem[] = table.restaurant.menuItems.map((item) => ({
    id: String(item.id),
    name: item.name,
    price: Number(item.price),
    description: item.description,
    category: item.category ?? "Other",
    dietary: item.dietary
      ? item.dietary
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    allergens: item.menuItemAllergens.map(({ allergen }) => allergen.name),
  }));

  return <CustomerTableMenu menuItems={menuItems} />;
}
