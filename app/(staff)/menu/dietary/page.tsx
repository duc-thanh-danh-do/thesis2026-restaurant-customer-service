"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import MenuAdminHeader from "@/components/menu/MenuManagementHeader";
import TagManager from "@/components/menu/TagManager";
import {
  getDietaryTagsAction,
  createDietaryTagAction,
  deleteDietaryTagAction,
} from "@/actions/catalog.action";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Toast, { useToast } from "@/components/ui/Toast";

export default function DietaryPage() {
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toastMessage, showToast } = useToast();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tagName: "",
  });

  const fetchTags = useCallback(async () => {
    const tags = await getDietaryTagsAction();
    setDietaryTags(tags);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAddTag = (newTag: string) => {
    const formattedTag = newTag.toUpperCase();
    if (dietaryTags.includes(formattedTag)) {
      showToast(`"${formattedTag}" already exists!`);
      return;
    }

    startTransition(async () => {
      setDietaryTags((prev) => [...prev, formattedTag]);
      const result = await createDietaryTagAction(formattedTag);
      if (result.success) showToast(`Added ${formattedTag}`);
      else {
        fetchTags();
        alert("Failed to save to database");
      }
    });
  };

  const handleConfirmDelete = () => {
    const tagToRemove = deleteModal.tagName;
    startTransition(async () => {
      setDietaryTags((prev) => prev.filter((t) => t !== tagToRemove));
      setDeleteModal({ isOpen: false, tagName: "" });

      const result = await deleteDietaryTagAction(tagToRemove);
      if (result.success) showToast(`Deleted ${tagToRemove}`);
      else {
        fetchTags();
        alert("Failed to delete from database");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#f5f9fc] overflow-hidden relative">
      <MenuAdminHeader />

      <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
        <TagManager
          title="Add dietary tag"
          placeholder="e.g. Halal, Sugar-free"
          catalogName="CATALOG"
          items={dietaryTags}
          isPending={isPending}
          onAdd={handleAddTag}
          onDelete={(tag) => setDeleteModal({ isOpen: true, tagName: tag })}
        />
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.tagName}
        title="Delete Dietary Tag"
        onCancel={() => setDeleteModal({ isOpen: false, tagName: "" })}
        onConfirm={handleConfirmDelete}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
