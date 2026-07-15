import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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

type HandoverRuleSeed = {
  name: string;
  category: string;
  requestType: string;
  keywords: string[];
  responseMessage: string;
  priority: number;
};

const handoverRules: HandoverRuleSeed[] = [
  {
    name: "Emergency or medical concern",
    category: "emergency",
    requestType: "emergency_assistance",
    keywords: ["emergency", "medical", "ambulance", "choking", "sick", "faint", "hurt"],
    responseMessage: "Restaurant staff should assist immediately with this urgent request.",
    priority: 100,
  },
  {
    name: "Allergy confirmation",
    category: "allergy",
    requestType: "allergy_confirmation",
    keywords: [
      "allergy",
      "allergic",
      "allergen",
      "gluten",
      "peanut",
      "nut",
      "nuts",
      "dairy",
      "milk",
      "egg",
      "soy",
      "sesame",
      "shellfish",
      "fish",
    ],
    responseMessage: "Restaurant staff should confirm allergy safety before the customer orders or eats.",
    priority: 90,
  },
  {
    name: "Complaint or manager request",
    category: "complaint",
    requestType: "complaint_support",
    keywords: ["complaint", "complain", "manager", "wrong", "unhappy", "refund", "problem"],
    responseMessage: "Restaurant staff should handle this service issue directly.",
    priority: 80,
  },
  {
    name: "Bill or payment request",
    category: "payment",
    requestType: "payment_assistance",
    keywords: ["bill", "pay", "payment", "card", "cash", "receipt", "split"],
    responseMessage: "Restaurant staff should help with payment or bill requests.",
    priority: 70,
  },
  {
    name: "Staff help requested",
    category: "staff_help",
    requestType: "staff_help",
    keywords: ["staff", "waiter", "waitress", "server", "help", "call someone"],
    responseMessage: "Restaurant staff should assist the customer directly.",
    priority: 60,
  },
  {
    name: "Unknown restaurant information",
    category: "unknown_information",
    requestType: "staff_help",
    keywords: ["__low_confidence__"],
    responseMessage: "Restaurant staff should confirm this because the answer was not available in the AI context.",
    priority: 10,
  },
];

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

async function upsertHandoverRule(
  restaurantId: number,
  rule: HandoverRuleSeed,
) {
  await prisma.$executeRaw`
    INSERT INTO "handover_rules" (
      "restaurant_id",
      "name",
      "category",
      "request_type",
      "keywords",
      "response_message",
      "priority",
      "is_active",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${restaurantId},
      ${rule.name},
      ${rule.category},
      ${rule.requestType},
      ${JSON.stringify(rule.keywords)}::jsonb,
      ${rule.responseMessage},
      ${rule.priority},
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT ("restaurant_id", "name")
    DO UPDATE SET
      "category" = EXCLUDED."category",
      "request_type" = EXCLUDED."request_type",
      "keywords" = EXCLUDED."keywords",
      "response_message" = EXCLUDED."response_message",
      "priority" = EXCLUDED."priority",
      "updated_at" = NOW()
  `;
}

async function main() {
  const restaurant = await upsertRestaurant();
  const staffPassword = process.env.STAFF_DEFAULT_PASSWORD ?? "staff1234";
  const staffPasswordHash = await bcrypt.hash(staffPassword, 12);

  await prisma.staffUser.upsert({
    where: { email: "staff@testpizza.local" },
    update: {
      restaurantId: restaurant.id,
      name: "Shift Lead",
      passwordHash: staffPasswordHash,
      role: "admin",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "Shift Lead",
      email: "staff@testpizza.local",
      passwordHash: staffPasswordHash,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    },
  });

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

  for (const rule of handoverRules) {
    await upsertHandoverRule(restaurant.id, rule);
  }

  const table2 = await prisma.restaurantTable.findFirst({
    where: { tableNumber: "2" },
  });

  if (table2) {
    const diningSession =
      (await prisma.diningSession.findFirst({
        where: {
          tableId: table2.id,
          status: "active",
        },
      })) ??
      (await prisma.diningSession.create({
        data: {
          restaurantId: restaurant.id,
          tableId: table2.id,
          status: "active",
          startedAt: new Date(),
        },
      }));

    const session = await prisma.customerSession.upsert({
      where: { sessionToken: "test-session-table-2" },
      update: {
        diningSessionId: diningSession.id,
      },
      create: {
        diningSessionId: diningSession.id,
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
    // Create a real staff-visible order with initial status "preparing"
    const newOrder = await prisma.order.create({
      data: {
        sessionId: existingSession.id,
        status: "preparing",
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
