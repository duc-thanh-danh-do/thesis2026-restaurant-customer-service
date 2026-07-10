import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill } from "@/components/admin/AdminPrimitives";
import { AvailabilityToggle } from "@/components/admin/AvailabilityToggle";
import { Input } from "@/components/ui/input";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MenuManagerPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireAdminUser();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: user.restaurantId,
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: { menuItemAllergens: { include: { allergen: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <AdminPageHeader eyebrow="Menu" title="Structured menu manager" description="Manage the same dishes, prices, allergens, dietary data, and availability used by customers and the AI." action={<Link href="/menu/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#142653] px-4 text-sm font-semibold text-white"><Plus className="size-4" /> Add menu item</Link>} />
      <form className="mb-4 flex gap-2" method="get">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input name="q" defaultValue={query} className="h-10 border-slate-200 bg-white pl-9 shadow-sm" placeholder="Search menu items…" /></div>
        <button className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700" type="submit">Search</button>
      </form>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="hidden grid-cols-[1.4fr_0.8fr_0.6fr_1fr_0.9fr_auto] gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Item</span><span>Category</span><span>Price</span><span>Allergens</span><span>Availability</span><span /></div>
        <div className="divide-y divide-slate-100">
          {items.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No menu items match this search.</p> : items.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-5 md:grid-cols-[1.4fr_0.8fr_0.6fr_1fr_0.9fr_auto] md:items-center">
              <div><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{item.description || "No description"}</p></div>
              <p className="text-sm text-slate-600">{item.category || "Uncategorised"}</p>
              <p className="text-sm font-semibold text-slate-700">€{Number(item.price).toFixed(2)}</p>
              <div className="flex flex-wrap gap-1">{item.menuItemAllergens.length ? item.menuItemAllergens.map(({ allergen }) => <StatusPill key={allergen.id} tone="warning">{allergen.name}</StatusPill>) : <span className="text-xs text-slate-400">None listed</span>}</div>
              <AvailabilityToggle itemId={item.id} initial={item.isAvailable} label={item.name} />
              <Link href={`/menu/${item.id}/edit`} aria-label={`Edit ${item.name}`} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><Pencil className="size-4" /></Link>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Showing {items.length} menu item{items.length === 1 ? "" : "s"}. Availability changes are persisted immediately.</p>
    </>
  );
}
