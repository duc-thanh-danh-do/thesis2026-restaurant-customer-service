import { Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface MenuItem {
  id: number;
  name: string;
  category: string | null;
  price: number;
  isAvailable: boolean;
  dietary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

interface MenuItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggleAvailability: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number, name: string) => void;
}

export default function MenuItemForm({
  item,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuItemProps) {
  return (
    <Card
      className={`p-4 bg-white border border-[#d5e1ec] rounded-[20px] transition-opacity duration-200 ${
        !item.isAvailable ? "opacity-50 grayscale-[50%]" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            )}
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
              {item.dietary && ` · ${item.dietary.toLowerCase()}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* edit button */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-1 text-sm h-8"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          {/* availability Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onToggleAvailability(item.id, item.isAvailable)}
          >
            {item.isAvailable ? (
              <Eye className="h-4 w-4 text-gray-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-slate-400" />
            )}
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={() => onDelete(item.id, item.name)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
