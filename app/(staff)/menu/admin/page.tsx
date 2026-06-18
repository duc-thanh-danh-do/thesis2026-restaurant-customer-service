"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";
import AddDishDrawer from "@/components/menu/AddDishDrawer";
import {
  getMenuItemsAction,
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
} from "@/actions/menu-item.action";

interface MenuItem {
  id: number;
  name: string;
  category: string | null;
  price: number;
  isAvailable: boolean;
  dietary?: string | null;
  // isVegetarian: boolean;
  // isVegan: boolean;
  description?: string | null;
  imageUrl?: string | null;
}

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

  const fetchItems = async () => {
    setIsLoading(true);
    const data = await getMenuItemsAction();
    setMenuItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getMenuItemsAction();
    };
    fetchItems();
  }, []);

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
            {categoryOrder.map((category) => {
              const items = menuItemsByCategory[category] || [];
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="text-sm font-medium text-[#142653] uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className={`p-4 bg-white border border-[#d5e1ec] rounded-[20px] transition-opacity duration-200 ${
                          !item.isAvailable ? "opacity-50 grayscale-[50%]" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <div className="w-6 h-6 bg-gray-300 rounded"></div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[#142653] flex items-center">
                                <span className="truncate">{item.name}</span>
                                {!item.isAvailable && (
                                  <span className="ml-2 text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                €{item.price.toFixed(2)}
                                {/* {item.isVegetarian && " · vegetarian"}
                                {item.isVegan && " · vegan"} */}
                                {item.dietary && ` · ${item.dietary.toLowerCase()}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full px-3 py-1 text-sm h-8"
                              onClick={() => {
                                setEditingItem(item);
                                setIsDrawerOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                handleToggleAvailability(
                                  item.id,
                                  item.isAvailable
                                )
                              }
                            >
                              {item.isAvailable ? (
                                <Eye className="h-4 w-4 text-gray-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-slate-400" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => triggerDelete(item.id, item.name)}
                            >
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

      <AddDishDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.name}
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, name: "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// Delete Alert Popup
function DeleteConfirmModal({
  isOpen,
  name,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Delete Dish</h3>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-800">&quot;{name}&quot;</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-slate-600"
          >
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white shadow-sm"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
