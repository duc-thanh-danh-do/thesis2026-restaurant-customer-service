"use client";

import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  name: string;
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  name,
  title = "Delete",
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
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
