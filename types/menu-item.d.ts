export type MenuItemDto = {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  ingredients: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type MenuItemsResponse = {
  menuItems: MenuItemDto[];
};
