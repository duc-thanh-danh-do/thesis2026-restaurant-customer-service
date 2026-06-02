import MenuItemCard from "../../components/customer/MenuItemCard";
import { fetchMenuItems } from "../../lib/api/menuApi";

const TEMP_RESTAURANT_ID = 1;

export default async function CustomersPage() {
  try {
    const { menuItems } = await fetchMenuItems(TEMP_RESTAURANT_ID);

    const categories = Array.from(
      new Set(menuItems.map((item) => item.category ?? "Other")),
    );

    return (
      <main>
        <div className="mx-auto flex w-full max-w-md flex-col px-4 py-6 sm:max-w-lg sm:px-6">
          <header className="mb-6">
            <p className="text-sm font-medium text-neutral-500">Welcome to</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
              TestPizza
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Browse the menu, check ingredients and allergens, then ask the
              assistant if you need help.
            </p>
          </header>

          {menuItems.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
              <h2 className="text-base font-semibold text-neutral-900">
                No menu items available
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Please ask restaurant staff for assistance.
              </p>
            </section>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => {
                const itemsInCategory = menuItems.filter(
                  (item) => (item.category ?? "Other") === category,
                );

                return (
                  <section key={category}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-neutral-950">
                        {category}
                      </h2>

                      <span className="text-xs font-medium text-neutral-500">
                        {itemsInCategory.length} item
                        {itemsInCategory.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {itemsInCategory.map((item) => (
                        <MenuItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <div className="mx-auto w-full max-w-md px-4 py-6 sm:max-w-lg sm:px-6">
          <section className="rounded-2xl border border-red-100 bg-white p-6">
            <h1 className="text-xl font-semibold text-neutral-950">
              Menu could not be loaded
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Please check that the backend server is running and that the API
              URL is correct.
            </p>

            <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </section>
        </div>
      </main>
    );
  }
}
