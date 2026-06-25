"use client";

import MenuItemForm, {MenuItem} from "./MenuItemForm";

interface MenuCategoryGroupProps {
    category: string;
    items: MenuItem[];
    onEdit: (item: MenuItem) => void;
    onToggleAvailability: (id: number, currentStatus: boolean) => void;
    onDelete: (id: number, name: string) => void;
  }

export default function MenuCategoryGroup({
  category,
  items,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuCategoryGroupProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-[#142653] uppercase tracking-wide">
        {category}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <MenuItemForm
            key={item.id}
            item={item}
            onEdit={onEdit}
            onToggleAvailability={onToggleAvailability}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}