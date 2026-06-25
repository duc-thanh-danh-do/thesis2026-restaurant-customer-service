"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";
import AddDishDrawer from "@/components/menu/AddDishDrawer";
import { MenuItem } from "@/components/menu/MenuItemForm";
import {
  getMenuItemsAction,
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
} from "@/actions/menu-item.action";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import MenuCategoryGroup from "@/components/menu/MenuCategoryGroup";

// Main page
export default function MenuAdminPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: 0,
    name: "",
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await getMenuItemsAction();
    setMenuItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    fetchItems();
  };

  const triggerDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const result = await deleteMenuItemAction(deleteModal.id);
    if (result.success) {
      fetchItems();
      setDeleteModal({ isOpen: false, id: 0, name: "" });
    } else {
      alert("Failed to delete dish.");
    }
  };

  const handleToggleAvailability = async (
    id: number,
    currentStatus: boolean
  ) => {
    const result = await toggleMenuItemAvailabilityAction(id, currentStatus);
    if (result.success) {
      fetchItems();
    } else {
      alert("Failed to toggle availability.");
    }
  };

  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    const cat = (item.category || "OTHER").toUpperCase();
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const dataCategories = Object.keys(menuItemsByCategory);
  const preferredOrder = [
    "STARTERS",
    "MAINS",
    "SIDES",
    "DESSERTS",
    "DRINKS",
    "OTHER",
  ];
  const categoryOrder = Array.from(
    new Set([...preferredOrder, ...dataCategories])
  );

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
              onClick={() => {
                setEditingItem(null);
                setIsDrawerOpen(true);
              }}
              className="bg-[#142653] hover:bg-[#13275a] text-white rounded-full px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add dish
            </Button>
          </div>

          {/* Dish List */}
          <div className="space-y-6">
            {categoryOrder.map((category) => (
              <MenuCategoryGroup
                key={category}
                category={category}
                items={menuItemsByCategory[category]}
                onEdit={(editItem) => {
                  setEditingItem(editItem);
                  setIsDrawerOpen(true);
                }}
                onToggleAvailability={handleToggleAvailability}
                onDelete={triggerDelete}
              />
            ))}
          </div>
        </div>
      </div>

      <AddDishDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.name}
        title="Delete Dish"
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, name: "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
