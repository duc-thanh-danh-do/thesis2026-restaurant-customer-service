import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('restaurants/:restaurantId/menu-items')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenuItems(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('category') category?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('isVegetarian') isVegetarian?: string,
  ) {
    return this.menuService.getMenuItems(restaurantId, {
      category,
      isAvailable,
      isVegetarian,
    });
  }
}
