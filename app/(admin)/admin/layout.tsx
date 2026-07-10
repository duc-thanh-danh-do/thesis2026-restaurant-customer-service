import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const [restaurant, published] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: user.restaurantId }, select: { name: true } }),
    prisma.aiInstructionVersion.findFirst({ where: { restaurantId: user.restaurantId, status: "PUBLISHED" } }),
  ]);
  return (
    <div className="flex min-h-screen bg-[#f5f9fc]">
      <AdminNav publishedVersion={published ? `v${published.version}` : "not published"} />
      <div className="min-w-0 flex-1 lg:pl-64">
        <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} userName={user.name} />
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
