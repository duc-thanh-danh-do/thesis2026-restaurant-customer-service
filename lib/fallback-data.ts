import type { MenuItemDto } from "@/types/menu-item";

export const fallbackRestaurant = {
  id: 1,
  name: "TestPizza",
  description: "Temporary pizza restaurant for testing the AI chat prototype.",
  address: "Test Street 1",
};

export const fallbackTables = [
  {
    id: 1,
    restaurantId: 1,
    tableNumber: "1",
    qrCodeToken: "testpizza-table-1",
    isActive: true,
    createdAt: new Date(0),
  },
  {
    id: 2,
    restaurantId: 1,
    tableNumber: "2",
    qrCodeToken: "testpizza-table-2",
    isActive: true,
    createdAt: new Date(0),
  },
];

export const fallbackMenuItems: MenuItemDto[] = [
  {
    id: 1,
    restaurantId: 1,
    name: "Margherita Pizza",
    description: "Classic pizza with tomato sauce, mozzarella, basil, and olive oil.",
    category: "Pizza",
    price: 11.9,
    ingredients: "Pizza dough, tomato sauce, mozzarella, basil, olive oil",
    imageUrl: null,
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    allergens: [
      { id: 1, name: "Gluten", description: "Found in wheat-based pizza dough and bread." },
      { id: 2, name: "Milk", description: "Found in mozzarella and other dairy ingredients." },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 2,
    restaurantId: 1,
    name: "Pepperoni Pizza",
    description: "Tomato sauce, mozzarella, pepperoni, and oregano.",
    category: "Pizza",
    price: 13.9,
    ingredients: "Pizza dough, tomato sauce, mozzarella, pepperoni, oregano",
    imageUrl: null,
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    allergens: [
      { id: 1, name: "Gluten", description: "Found in wheat-based pizza dough and bread." },
      { id: 2, name: "Milk", description: "Found in mozzarella and other dairy ingredients." },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 3,
    restaurantId: 1,
    name: "Vegan Garden Pizza",
    description: "Plant-based pizza with seasonal vegetables and vegan cheese.",
    category: "Pizza",
    price: 12.9,
    ingredients: "Pizza dough, tomato sauce, vegan cheese, bell pepper, mushroom, red onion, olives",
    imageUrl: null,
    isAvailable: true,
    isVegetarian: true,
    isVegan: true,
    allergens: [
      { id: 1, name: "Gluten", description: "Found in wheat-based pizza dough and bread." },
      { id: 4, name: "Soy", description: "May be present in vegan cheese or sauces." },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 4,
    restaurantId: 1,
    name: "Tuna Pizza",
    description: "Tomato sauce, mozzarella, tuna, red onion, and capers.",
    category: "Pizza",
    price: 14.5,
    ingredients: "Pizza dough, tomato sauce, mozzarella, tuna, red onion, capers",
    imageUrl: null,
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    allergens: [
      { id: 1, name: "Gluten", description: "Found in wheat-based pizza dough and bread." },
      { id: 2, name: "Milk", description: "Found in mozzarella and other dairy ingredients." },
      { id: 6, name: "Fish", description: "Found in tuna and other seafood toppings." },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 5,
    restaurantId: 1,
    name: "Garlic Bread",
    description: "Oven-baked bread with garlic butter, herbs, and a light egg wash.",
    category: "Side",
    price: 5.9,
    ingredients: "Bread, garlic butter, egg wash, parsley, sesame seed topping",
    imageUrl: null,
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    allergens: [
      { id: 1, name: "Gluten", description: "Found in wheat-based pizza dough and bread." },
      { id: 2, name: "Milk", description: "Found in mozzarella and other dairy ingredients." },
      { id: 3, name: "Egg", description: "May be present in sauces, doughs, or toppings." },
      { id: 5, name: "Sesame", description: "May be present in breads or shared areas." },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

export const fallbackKnowledgeBase = [
  {
    title: "Opening hours",
    category: "opening_hours",
    content:
      "TestPizza is open Monday to Saturday from 11:00 to 22:00 and Sunday from 12:00 to 20:00.",
  },
  {
    title: "Payment options",
    category: "payment",
    content:
      "Customers can pay by card, mobile payment, or cash. Receipts are available on request.",
  },
  {
    title: "Allergy support",
    category: "allergy_policy",
    content:
      "For allergy questions, summarize known allergens and ask staff to confirm before serving.",
  },
];

export function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;

  return /connection|connect|closed|ECONNREFUSED|P1000|P1001|Can't reach database|Authentication failed|database credentials/i.test(
    error.message,
  );
}
