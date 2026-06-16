"use client";

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { Plus, Pencil, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";
import AddDishDrawer from "@/components/menu/AddDishDrawer";
import { getMenuItemsAction } from "@/actions/menu-item.action";

export default function MenuAdminPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    const data = await getMenuItemsAction();
    setMenuItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    fetchItems();
  };

  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || "OTHER";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryOrder = [
    "STARTERS",
    "MAINS",
    "SIDES",
    "DESSERTS",
    "DRINKS",
    "OTHER",
  ];

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#f5f9fc] overflow-hidden relative">
      <MenuAdminHeader />

      <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              DISHES {isLoading ? "(Loading...)" : `(${menuItems.length})`}
            </div>
            <Button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-[#142653] hover:bg-[#13275a] text-white rounded-full px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add dish
            </Button>
          </div>

          <div className="space-y-6">
            {!isLoading && menuItems.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-10">
                No dishes found. Click "Add dish" to create one!
              </p>
            )}

            {categoryOrder.map((category) => {
              const items = menuItemsByCategory[category] || [];
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="text-sm font-medium text-[#142653] uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-2">
                    {items.map((item: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; price: number; isVegetarian: any; isVegan: any; }) => (
                      <Card
                        key={item.id}
                        className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-gray-300 rounded"></div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[#142653]">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                €{item.price.toFixed(2)}
                                {item.isVegetarian && " · vegetarian"}
                                {item.isVegan && " · vegan"}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full px-3 py-1 text-sm"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AddDishDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
}
