export type Allergen = {
  id: number;
  name: string;
  description?: string | null;
};

export type MenuItem = {
  id: number;
  restaurantId: number;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  ingredients?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: Allergen[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MenuItemsResponse = {
  menuItems: MenuItem[];
};