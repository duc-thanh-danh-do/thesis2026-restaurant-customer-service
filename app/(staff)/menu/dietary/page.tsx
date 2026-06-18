"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";

const INITIAL_TAGS = [
  "VEGAN",
  "VEGETARIAN",
  "BLUTEN-FREE",
  "SPICY",
  "HALAL",
  "DAIRY-FREE",
  "NUT-FREE",
  "KOSHER",
];

export default function DietaryPage() {
  const [newTag, setNewTag] = useState("");
  const [dietaryTags, setDietaryTags] = useState(INITIAL_TAGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const addTag = () => {
    const formattedTag = newTag.trim().toUpperCase();
    if (formattedTag && !dietaryTags.includes(formattedTag)) {
      setDietaryTags([...dietaryTags, formattedTag]);
      setNewTag("");
      showToast(`Added ${formattedTag}`);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDietaryTags(dietaryTags.filter((t) => t !== tagToRemove));
    showToast(`Deleted ${tagToRemove}`);
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#f5f9fc] overflow-hidden relative">
      {/* Header */}
      <MenuAdminHeader />

      {/* Dietary Tags */}
      <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
        <div className="max-w-[620px] mx-auto space-y-6">
          {/* Add Tag Card */}
          <Card className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#142653]">
                Add dietary tag
              </Label>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g. Halal, Sugar-free"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 border-[#d5e1ec] rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTag();
                    }
                  }}
                />
                <Button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Catalog */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              CATALOG ({dietaryTags.length})
            </div>
            <div className="space-y-2">
              {[...dietaryTags]
                .sort((a, b) => a.localeCompare(b))
                .map((tag, index) => (
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
                        onClick={() => removeTag(tag)}
                        className="p-2 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Toast */}
          {toastMessage && (
            <div className="fixed absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-[#142653] text-white text-sm px-5 py-2.5 rounded-full shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 z-50">
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
