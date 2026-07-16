import assert from "node:assert/strict";
import test from "node:test";
import { buildGroundedContextForAi } from "@/lib/ai/grounded-context";

const restaurant = {
  id: 1,
  name: "TestPizza",
  description: "Pizza restaurant",
  address: "Test Street 1",
  createdAt: null,
  updatedAt: null,
  menuItems: [
    {
      id: 1,
      restaurantId: 1,
      name: "Tuna Pizza",
      description: "Tuna, mozzarella, and capers.",
      category: "Pizza",
      price: { toString: () => "14.50" },
      ingredients: "Pizza dough, tomato sauce, mozzarella, tuna, capers",
      dietary: null,
      imageUrl: null,
      isAvailable: true,
      createdAt: null,
      updatedAt: null,
      menuItemAllergens: [
        {
          menuItemId: 1,
          allergenId: 6,
          allergen: {
            id: 6,
            name: "Fish",
            description: "Found in tuna.",
          },
        },
      ],
    },
  ],
  knowledgeBase: [
    {
      id: 1,
      restaurantId: 1,
      title: "Unrelated catering policy",
      content: "Catering requests need one week notice.",
      category: "policy",
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
  ],
};

test("grounded context keeps structured menu data and uses retrieved knowledge only", () => {
  const context = buildGroundedContextForAi(
    restaurant,
    [
      "Manual knowledge base matches:",
      "- Allergy policy",
      "  Content: Staff must confirm allergy questions.",
    ].join("\n"),
  );

  assert.match(context, /Tuna Pizza/);
  assert.match(context, /Allergens: Fish/);
  assert.match(context, /Allergy policy/);
  assert.doesNotMatch(context, /Unrelated catering policy/);
});

test("grounded context explains when no knowledge chunks were retrieved", () => {
  const context = buildGroundedContextForAi(restaurant);

  assert.match(context, /Tuna Pizza/);
  assert.match(context, /No relevant restaurant knowledge base records/);
});
