type GroundedRestaurantContext = {
  name: string;
  description: string | null;
  address: string | null;
  menuItems: Array<{
    name: string;
    description: string | null;
    category: string | null;
    price: { toString: () => string };
    isAvailable: boolean;
    dietary: string | null;
    ingredients: string | null;
    menuItemAllergens: Array<{
      allergen: {
        name: string;
      };
    }>;
  }>;
};

export function buildGroundedContextForAi(
  restaurant: GroundedRestaurantContext,
  retrievedKnowledgeContext = "",
) {
  const menuItems =
    restaurant.menuItems.length > 0
      ? restaurant.menuItems
          .map((item) => {
            const allergens = item.menuItemAllergens
              .map(({ allergen }) => allergen.name)
              .join(", ");

            return [
              `- ${item.name}`,
              `  Description: ${item.description ?? "Not available"}`,
              `  Category: ${item.category ?? "Not available"}`,
              `  Price: ${item.price.toString()}`,
              `  Available: ${item.isAvailable ? "yes" : "no"}`,
              `  Dietary tags: ${item.dietary ?? "None"}`,
              `  Ingredients: ${item.ingredients ?? "Not available"}`,
              `  Allergens: ${allergens || "None listed"}`,
            ].join("\n");
          })
          .join("\n\n")
      : "No menu items are available in the provided data.";

  return [
    `Restaurant: ${restaurant.name}`,
    `Description: ${restaurant.description ?? "Not available"}`,
    `Address: ${restaurant.address ?? "Not available"}`,
    "",
    "Menu items:",
    menuItems,
    "",
    "Retrieved restaurant knowledge:",
    retrievedKnowledgeContext ||
      "No relevant restaurant knowledge base records or uploaded document chunks were retrieved for this message.",
  ].join("\n");
}
