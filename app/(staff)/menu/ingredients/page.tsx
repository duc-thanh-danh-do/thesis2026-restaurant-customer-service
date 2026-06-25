"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";
import TagManager from "@/components/menu/TagManager";
import {
  getIngredientsAction,
  createIngredientAction,
  deleteIngredientAction,
} from "@/actions/catalog.action";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Toast, { useToast } from "@/components/ui/Toast";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toastMessage, showToast } = useToast();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tagName: "",
  });

  const fetchIngredients = useCallback(async () => {
    const data = await getIngredientsAction();
    setIngredients(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIngredients();
  }, [fetchIngredients]);

  const handleAddIngredient = (newIngredient: string) => {
    const formattedTag = newIngredient.toLowerCase();
    if (ingredients.includes(formattedTag)) {
      showToast(`"${formattedTag}" already exists!`);
      return;
    }

    startTransition(async () => {
      setIngredients((prev) => [...prev, formattedTag]);
      const result = await createIngredientAction(formattedTag);
      if (result.success) showToast(`Added ${formattedTag}`);
      else {
        fetchIngredients();
        alert("Failed to save to database");
      }
    });
  };

  const handleConfirmDelete = () => {
    const tagToRemove = deleteModal.tagName;
    startTransition(async () => {
      setIngredients((prev) => prev.filter((t) => t !== tagToRemove));
      setDeleteModal({ isOpen: false, tagName: "" });

      const result = await deleteIngredientAction(tagToRemove);
      if (result.success) showToast(`Deleted ${tagToRemove}`);
      else {
        fetchIngredients();
        alert("Failed to delete from database");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#f5f9fc] overflow-hidden relative">
      <MenuAdminHeader />

      <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
        <TagManager
          title="Add ingredient"
          placeholder="e.g. Garlic, Olive oil, Basil"
          catalogName="CATALOG"
          items={ingredients}
          isPending={isPending}
          onAdd={handleAddIngredient}
          onDelete={(tag) => setDeleteModal({ isOpen: true, tagName: tag })}
        />
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.tagName}
        title="Delete Ingredient"
        onCancel={() => setDeleteModal({ isOpen: false, tagName: "" })}
        onConfirm={handleConfirmDelete}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
