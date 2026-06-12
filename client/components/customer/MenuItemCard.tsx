import type { MenuItem } from "../../types/menu";

type MenuItemCardProps = {
  item: MenuItem;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const dietaryBadges = [
    item.isVegetarian ? "Vegetarian" : null,
    item.isVegan ? "Vegan" : null,
  ].filter(Boolean);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        item.isAvailable
          ? "border-neutral-200"
          : "border-neutral-200 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-950">
            {item.name}
          </h2>

          {item.category && (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              {item.category}
            </p>
          )}
        </div>

        <p className="shrink-0 text-sm font-semibold text-neutral-950">
          {formatPrice(item.price)}
        </p>
      </div>

      {item.description && (
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          {item.description}
        </p>
      )}

      {item.ingredients && (
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          <span className="font-medium text-neutral-700">Ingredients: </span>
          {item.ingredients}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {dietaryBadges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
          >
            {badge}
          </span>
        ))}

        {!item.isAvailable && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            Currently unavailable
          </span>
        )}
      </div>

      {item.allergens.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-neutral-700">Allergens</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {item.allergens.map((allergen) => (
              <span
                key={allergen.id}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                title={allergen.description ?? undefined}
              >
                {allergen.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}