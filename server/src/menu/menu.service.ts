import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type MenuItemFilters = {
  category?: string;
  isAvailable?: string;
  isVegetarian?: string;
};

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuItems(restaurantId: number, filters: MenuItemFilters) {
    const where: Prisma.MenuItemWhereInput = {
      restaurantId,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    const isAvailable = parseOptionalBoolean(
      filters.isAvailable,
      'isAvailable',
    );
    const isVegetarian = parseOptionalBoolean(
      filters.isVegetarian,
      'isVegetarian',
    );

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (isVegetarian !== undefined) {
      where.isVegetarian = isVegetarian;
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where,
      include: {
        menuItemAllergens: {
          include: {
            allergen: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      menuItems: menuItems.map((item) => ({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        ingredients: item.ingredients,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        allergens: item.menuItemAllergens.map(({ allergen }) => ({
          id: allergen.id,
          name: allergen.name,
          description: allergen.description,
        })),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }
}

function parseOptionalBoolean(value: string | undefined, name: string) {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new BadRequestException(`${name} must be true or false`);
}
