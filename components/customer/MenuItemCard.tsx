import type { MenuItemDto } from "@/types/menu-item";
import AllergenNotice from "@/components/customer/AllergenNotice";

export default function MenuItemCard({ item }: { item: MenuItemDto }) {
  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{item.description}</p>
        </div>
        <p className="shrink-0 text-sm font-bold">${item.price.toFixed(2)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {/* {item.isVegetarian ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Vegetarian</span> : null}
        {item.isVegan ? <span className="rounded-md bg-lime-50 px-2 py-1 text-lime-700">Vegan</span> : null} */}
        {item.dietary
          ? item.dietary.split(",").map((tag, index) => (
              <span
                key={index}
                className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 capitalize"
              >
                {tag.trim().toLowerCase()}
              </span>
            ))
          : null}
        {!item.isAvailable ? <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">Unavailable</span> : null}
      </div>
      <AllergenNotice allergens={item.allergens.map((allergen) => allergen.name)} />
    </article>
  );
}
