"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TagManagerProps {
  title: string;
  placeholder: string;
  catalogName: string;
  items: string[];
  isPending: boolean;
  onAdd: (tag: string) => void;
  onDelete: (tag: string) => void;
}

export default function TagManager({
  title,
  placeholder,
  catalogName,
  items,
  isPending,
  onAdd,
  onDelete,
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    onAdd(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className="max-w-[620px] mx-auto space-y-6">
      {/* input and addButton */}
      <Card className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-[#142653]">{title}</Label>
          <div className="flex gap-3">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isPending}
              className="flex-1 border-[#d5e1ec] rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handleAdd();
                }
              }}
            />
            <Button
              onClick={handleAdd}
              disabled={isPending}
              className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-4 transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              {isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </Card>

      {/* card and trash */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {catalogName} ({items.length})
        </div>
        <div className="space-y-2">
          {[...items]
            .sort((a, b) => a.localeCompare(b))
            .map((tag) => (
              <Card
                key={tag}
                className="p-3 bg-white border border-[#d5e1ec] rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#142653] capitalize font-medium">
                    {tag}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tag)}
                    disabled={isPending}
                    className="p-2 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
