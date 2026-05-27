import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type MenuItemSeed = {
  name: string;
  description: string;
  category: string;
  price: string;
  ingredients: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: string[];
};

async function upsertRestaurant() {
  const existing = await prisma.restaurant.findFirst({
    where: { name: 'TestPizza' },
  });

  const data = {
    name: 'TestPizza',
    description: 'Temporary pizza restaurant for testing the AI chat prototype.',
    address: 'Test Street 1',
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
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
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
  data: Prisma.RestaurantKnowledgeBaseUncheckedCreateInput,
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

  await prisma.restaurantTable.upsert({
    where: { qrCodeToken: 'testpizza-table-1' },
    update: {
      restaurantId: restaurant.id,
      tableNumber: '1',
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      tableNumber: '1',
      qrCodeToken: 'testpizza-table-1',
      isActive: true,
    },
  });

  await prisma.restaurantTable.upsert({
    where: { qrCodeToken: 'testpizza-table-2' },
    update: {
      restaurantId: restaurant.id,
      tableNumber: '2',
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      tableNumber: '2',
      qrCodeToken: 'testpizza-table-2',
      isActive: true,
    },
  });

  const allergenData = [
    {
      name: 'Gluten',
      description: 'Found in wheat-based pizza dough and bread.',
    },
    {
      name: 'Milk',
      description: 'Found in mozzarella, parmesan, and other dairy ingredients.',
    },
    {
      name: 'Egg',
      description: 'May be present in some sauces, doughs, or toppings.',
    },
    {
      name: 'Soy',
      description: 'May be present in vegan cheese, sauces, or processed toppings.',
    },
    {
      name: 'Sesame',
      description: 'May be present in breads, crust toppings, or shared preparation areas.',
    },
    {
      name: 'Fish',
      description: 'Found in tuna and other seafood toppings.',
    },
  ];

  const allergens = new Map<string, { id: number }>();

  for (const allergen of allergenData) {
    const record = await prisma.allergen.upsert({
      where: { name: allergen.name },
      update: {
        description: allergen.description,
      },
      create: allergen,
    });

    allergens.set(record.name, record);
  }

  const menuItems: MenuItemSeed[] = [
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, basil, and olive oil.',
      category: 'Pizza',
      price: '11.90',
      ingredients: 'Pizza dough, tomato sauce, mozzarella, basil, olive oil',
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      allergens: ['Gluten', 'Milk'],
    },
    {
      name: 'Pepperoni Pizza',
      description: 'Tomato sauce, mozzarella, pepperoni, and oregano.',
      category: 'Pizza',
      price: '13.90',
      ingredients: 'Pizza dough, tomato sauce, mozzarella, pepperoni, oregano',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      allergens: ['Gluten', 'Milk'],
    },
    {
      name: 'Vegan Garden Pizza',
      description: 'Plant-based pizza with seasonal vegetables and vegan cheese.',
      category: 'Pizza',
      price: '12.90',
      ingredients: 'Pizza dough, tomato sauce, vegan cheese, bell pepper, mushroom, red onion, olives',
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      allergens: ['Gluten', 'Soy'],
    },
    {
      name: 'Tuna Pizza',
      description: 'Tomato sauce, mozzarella, tuna, red onion, and capers.',
      category: 'Pizza',
      price: '14.50',
      ingredients: 'Pizza dough, tomato sauce, mozzarella, tuna, red onion, capers',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      allergens: ['Gluten', 'Milk', 'Fish'],
    },
    {
      name: 'Garlic Bread',
      description: 'Oven-baked bread with garlic butter, herbs, and a light egg wash.',
      category: 'Side',
      price: '5.90',
      ingredients: 'Bread, garlic butter, egg wash, parsley, sesame seed topping',
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      allergens: ['Gluten', 'Milk', 'Egg', 'Sesame'],
    },
  ];

  for (const item of menuItems) {
    const menuItem = await upsertMenuItem(restaurant.id, item);

    for (const allergenName of item.allergens) {
      const allergen = allergens.get(allergenName);

      if (!allergen) {
        throw new Error(`Missing allergen seed data for ${allergenName}`);
      }

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
    title: 'Opening hours',
    content: 'TestPizza is open Monday to Saturday from 11:00 to 22:00 and Sunday from 12:00 to 20:00.',
    category: 'opening_hours',
    isActive: true,
  });

  await upsertKnowledgeBaseRecord(restaurant.id, {
    restaurantId: restaurant.id,
    title: 'Payment options',
    content: 'Customers can pay by card, mobile payment, or cash. Receipts are available on request.',
    category: 'payment',
    isActive: true,
  });

  await upsertKnowledgeBaseRecord(restaurant.id, {
    restaurantId: restaurant.id,
    title: 'Allergy support',
    content: 'For allergy questions, the AI should summarize known allergens and ask staff to confirm before serving.',
    category: 'allergy_policy',
    isActive: true,
  });

  console.log('Seed data created for TestPizza.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
