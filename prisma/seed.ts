import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const datasourceUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/phygital_dining";

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: datasourceUrl,
    })
  ),
});

type MenuItemSeed = {
  name: string;
  description: string;
  category: string;
  price: string;
  ingredients: string;
  isAvailable: boolean;
  // isVegetarian: boolean;
  // isVegan: boolean;
  dietary?: string | null;
  allergens: string[];
};

async function upsertRestaurant() {
  const existing = await prisma.restaurant.findFirst({
    where: { name: "TestPizza" },
  });

  const data = {
    name: "TestPizza",
    description:
      "Temporary pizza restaurant for testing the AI chat prototype.",
    address: "Test Street 1",
  };

  if (existing) {
    return prisma.restaurant.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.restaurant.create({ data });
}

async function upsertMenuItem(restaurantId: number, item: MenuItemSeed) {
  const data = {
    restaurantId,
    name: item.name,
    description: item.description,
    category: item.category,
    price: new Prisma.Decimal(item.price),
    ingredients: item.ingredients,
    isAvailable: item.isAvailable,
    dietary: item.dietary,
  };

  const existing = await prisma.menuItem.findFirst({
    where: {
      restaurantId,
      name: item.name,
    },
  });

  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.menuItem.create({ data });
}

async function upsertKnowledgeBaseRecord(
  restaurantId: number,
  data: Prisma.RestaurantKnowledgeBaseUncheckedCreateInput
) {
  const existing = await prisma.restaurantKnowledgeBase.findFirst({
    where: {
      restaurantId,
      title: data.title,
    },
  });

  if (existing) {
    return prisma.restaurantKnowledgeBase.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.restaurantKnowledgeBase.create({ data });
}

async function main() {
  const restaurant = await upsertRestaurant();

  for (const tableNumber of ["1", "2"]) {
    await prisma.restaurantTable.upsert({
      where: { qrCodeToken: `testpizza-table-${tableNumber}` },
      update: {
        restaurantId: restaurant.id,
        tableNumber,
        isActive: true,
      },
      create: {
        restaurantId: restaurant.id,
        tableNumber,
        qrCodeToken: `testpizza-table-${tableNumber}`,
        isActive: true,
      },
    });
  }

  const allergenData = [
    ["Gluten", "Found in wheat-based pizza dough and bread."],
    ["Milk", "Found in mozzarella, parmesan, and other dairy ingredients."],
    ["Egg", "May be present in some sauces, doughs, or toppings."],
    ["Soy", "May be present in vegan cheese, sauces, or processed toppings."],
    [
      "Sesame",
      "May be present in breads, crust toppings, or shared preparation areas.",
    ],
    ["Fish", "Found in tuna and other seafood toppings."],
  ];

  const initialDietaryTags = [
    "VEGAN",
    "VEGETARIAN",
    "GLUTEN-FREE",
    "DAIRY-FREE",
    "NUT-FREE",
    "HALAL",
    "KOSHER",
    "SPICY",
  ];

  await prisma.dietaryCatalog.createMany({
    data: initialDietaryTags.map((tag) => ({
      name: tag,
      restaurantId: restaurant.id,
    })),
    skipDuplicates: true,
  });

  const initialIngredients = [
    "beets",
    "goat cheese",
    "walnuts",
    "citrus vinaigrette",
    "burrata",
    "heritage tomatoes",
    "basil",
    "sourdough",
    "carnaroli rice",
    "porcini",
    "thyme",
    "parmesan",
    "sea bass",
    "fennel",
    "lemon",
    "capers",
    "butter",
    "orecchiette",
    "n'duja",
    "chili",
    "pecorino",
    "broccolini",
    "garlic",
    "potato",
    "truffle oil",
    "dark chocolate",
    "vanilla ice cream",
    "shortcrust",
    "meringue",
    "seasonal fruit",
    "tempranillo",
    "mineral water",
  ];

  await prisma.ingredientCatalog.createMany({
    data: initialIngredients.map((tag) => ({
      name: tag,
      restaurantId: restaurant.id,
    })),
    skipDuplicates: true,
  });

  const allergens = new Map<string, { id: number }>();

  for (const [name, description] of allergenData) {
    const record = await prisma.allergen.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });

    allergens.set(record.name, record);
  }

  const menuItems: MenuItemSeed[] = [
    {
      name: "Margherita Pizza",
      description:
        "Classic pizza with tomato sauce, mozzarella, basil, and olive oil.",
      category: "Pizza",
      price: "11.90",
      ingredients: "Pizza dough, tomato sauce, mozzarella, basil, olive oil",
      isAvailable: true,
      // isVegetarian: true,
      // isVegan: false,
      dietary: "VEGETARIAN",
      allergens: ["Gluten", "Milk"],
    },
    {
      name: "Pepperoni Pizza",
      description: "Tomato sauce, mozzarella, pepperoni, and oregano.",
      category: "Pizza",
      price: "13.90",
      ingredients: "Pizza dough, tomato sauce, mozzarella, pepperoni, oregano",
      isAvailable: true,
      // isVegetarian: false,
      // isVegan: false,
      dietary: null,
      allergens: ["Gluten", "Milk"],
    },
    {
      name: "Vegan Garden Pizza",
      description:
        "Plant-based pizza with seasonal vegetables and vegan cheese.",
      category: "Pizza",
      price: "12.90",
      ingredients:
        "Pizza dough, tomato sauce, vegan cheese, bell pepper, mushroom, red onion, olives",
      isAvailable: true,
      // isVegetarian: true,
      // isVegan: true,
      dietary: "VEGAN",
      allergens: ["Gluten", "Soy"],
    },
    {
      name: "Tuna Pizza",
      description: "Tomato sauce, mozzarella, tuna, red onion, and capers.",
      category: "Pizza",
      price: "14.50",
      ingredients:
        "Pizza dough, tomato sauce, mozzarella, tuna, red onion, capers",
      isAvailable: true,
      // isVegetarian: false,
      // isVegan: false,
      dietary: null,
      allergens: ["Gluten", "Milk", "Fish"],
    },
    {
      name: "Garlic Bread",
      description:
        "Oven-baked bread with garlic butter, herbs, and a light egg wash.",
      category: "Side",
      price: "5.90",
      ingredients:
        "Bread, garlic butter, egg wash, parsley, sesame seed topping",
      isAvailable: true,
      // isVegetarian: true,
      // isVegan: false,
      dietary: "VEGETARIAN",
      allergens: ["Gluten", "Milk", "Egg", "Sesame"],
    },
  ];

  for (const item of menuItems) {
    const menuItem = await upsertMenuItem(restaurant.id, item);

    for (const allergenName of item.allergens) {
      const allergen = allergens.get(allergenName);
      if (!allergen)
        throw new Error(`Missing allergen seed data for ${allergenName}`);

      await prisma.menuItemAllergen.upsert({
        where: {
          menuItemId_allergenId: {
            menuItemId: menuItem.id,
            allergenId: allergen.id,
          },
        },
        update: {},
        create: {
          menuItemId: menuItem.id,
          allergenId: allergen.id,
        },
      });
    }
  }

  await upsertKnowledgeBaseRecord(restaurant.id, {
    restaurantId: restaurant.id,
    title: "Opening hours",
    content:
      "TestPizza is open Monday to Saturday from 11:00 to 22:00 and Sunday from 12:00 to 20:00.",
    category: "opening_hours",
    isActive: true,
  });

  await upsertKnowledgeBaseRecord(restaurant.id, {
    restaurantId: restaurant.id,
    title: "Payment options",
    content:
      "Customers can pay by card, mobile payment, or cash. Receipts are available on request.",
    category: "payment",
    isActive: true,
  });

  await upsertKnowledgeBaseRecord(restaurant.id, {
    restaurantId: restaurant.id,
    title: "Allergy support",
    content:
      "For allergy questions, the AI should summarize known allergens and ask staff to confirm before serving.",
    category: "allergy_policy",
    isActive: true,
  });

  const table2 = await prisma.restaurantTable.findFirst({
    where: { tableNumber: "2" },
  });

  if (table2) {
    const session = await prisma.customerSession.upsert({
      where: { sessionToken: "test-session-table-2" },
      update: {},
      create: {
        restaurantId: restaurant.id,
        tableId: table2.id,
        sessionToken: "test-session-table-2",
        status: "active",
        startedAt: new Date(),
      },
    });

    const existingRequest = await prisma.customerRequest.findFirst({
      where: { sessionId: session.id },
    });
    if (!existingRequest) {
      const newRequest = await prisma.customerRequest.create({
        data: {
          sessionId: session.id,
          requestType: "Request bill",
          status: "Waiting",
          description: "Customer wants to pay",
          createdAt: new Date(),
        },
      });
      console.log(`CustomerRequest! ID is: ${newRequest.id}`);
    }
  }

  console.log("Seed data created for TestPizza.");

  // NEW: Create a real test order for the Staff Dashboard
  // Orders must belong to a session, so fetch the first existing customer session
  const existingSession = await prisma.customerSession.findFirst();

  if (existingSession) {
    // Create a real order with initial status "Preparing"
    const newOrder = await prisma.order.create({
      data: {
        sessionId: existingSession.id,
        status: "Preparing",
        total: 26.5,

        orderItems: {
          create: [
            { name: "Wild Mushroom Risotto", price: 17.0, quantity: 1 },
            { name: "Roasted Beet Salad", price: 9.5, quantity: 1 },
          ],
        },
      },
    });
    console.log(
      `Order seed data created successfully! Order ID: ${newOrder.id}`
    );
  } else {
    console.log(
      "Notice: No CustomerSession found in the database. Cannot create order. Please ensure session data is seeded first!"
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
