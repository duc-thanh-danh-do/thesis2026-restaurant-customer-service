"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAllergensAction,
  createAllergenAction,
  deleteAllergenAction,
} from "@/actions/allergen.action";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Toast, { useToast } from "@/components/ui/Toast";

type Allergen = { id: number; name: string; description: string | null };

export default function AllergenTable() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toastMessage, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: 0,
    name: "",
  });

  const fetchAllergens = useCallback(async () => {
    const data = await getAllergensAction();
    setAllergens(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllergens();
  }, [fetchAllergens]);

  const handleAdd = () => {
    const name = inputValue.trim().toLowerCase();
    if (!name) return;
    if (allergens.some((a) => a.name === name)) {
      showToast(`"${name}" already exists!`);
      return;
    }

    startTransition(async () => {
      setInputValue("");
      const result = await createAllergenAction(name);
      if (result.success) {
        showToast(`Added ${name}`);
        fetchAllergens();
      } else {
        showToast(result.error || "Failed to add");
      }
    });
  };

  const handleConfirmDelete = () => {
    const { id, name } = deleteModal;
    startTransition(async () => {
      setDeleteModal({ isOpen: false, id: 0, name: "" });
      const result = await deleteAllergenAction(id);
      if (result.success) {
        showToast(`Deleted ${name}`);
        fetchAllergens();
      } else {
        showToast("Failed to delete");
      }
    });
  };

  return (
    <div className="max-w-[620px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Allergen management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage allergens that can be linked to menu items.
        </p>
      </div>

      <Card className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-[#142653]">Add allergen</Label>
          <div className="flex gap-3">
            <Input
              placeholder="e.g. Gluten, Dairy, Nuts"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isPending}
              className="flex-1 border-[#d5e1ec] rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) handleAdd();
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

      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          CATALOG ({allergens.length})
        </div>
        <div className="space-y-2">
          {allergens.map((allergen) => (
            <Card
              key={allergen.id}
              className="p-3 bg-white border border-[#d5e1ec] rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#142653] capitalize font-medium">
                    {allergen.name}
                  </span>
                  {allergen.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {allergen.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      id: allergen.id,
                      name: allergen.name,
                    })
                  }
                  disabled={isPending}
                  className="p-2 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </Card>
          ))}
          {allergens.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No allergens yet. Add one above.
            </p>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.name}
        title="Delete Allergen"
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, name: "" })}
        onConfirm={handleConfirmDelete}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
