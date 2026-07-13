"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getKnowledgeBaseEntriesAction,
  deleteKnowledgeBaseEntryAction,
} from "@/actions/knowledge-base.action";
import type { KnowledgeBaseEntry } from "@/actions/knowledge-base.action";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Toast, { useToast } from "@/components/ui/Toast";

const CATEGORIES = [
  "allergy",
  "menu",
  "policy",
  "operations",
  "faq",
  "general",
];

export default function KnowledgeBaseTable() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const { toastMessage, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: 0,
    title: "",
  });

  const fetchEntries = useCallback(async () => {
    const data = await getKnowledgeBaseEntriesAction();
    setEntries(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, [fetchEntries]);

  const filtered =
    filter === "all"
      ? entries
      : entries.filter((e) => e.category === filter);

  const handleConfirmDelete = () => {
    const { id, title } = deleteModal;
    startTransition(async () => {
      setDeleteModal({ isOpen: false, id: 0, title: "" });
      const result = await deleteKnowledgeBaseEntryAction(id);
      if (result.success) {
        showToast(`Deleted "${title}"`);
        fetchEntries();
      } else {
        showToast("Failed to delete");
      }
    });
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage AI context entries that help the assistant answer questions.
          </p>
        </div>
        <Link href="/knowledge-base/new">
          <Button className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-4">
            <Plus className="h-4 w-4 mr-1" />
            Add entry
          </Button>
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Entries list */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          ENTRIES ({filtered.length})
        </div>
        {filtered.map((entry) => (
          <Card
            key={entry.id}
            className="p-4 bg-white border border-[#d5e1ec] rounded-lg shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#142653] truncate">
                    {entry.title}
                  </h3>
                  {!entry.isActive && (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                  {entry.category && (
                    <span className="shrink-0 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {entry.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {entry.content}
                </p>
                {entry.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/knowledge-base/${entry.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      id: entry.id,
                      title: entry.title,
                    })
                  }
                  disabled={isPending}
                  className="p-2 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No entries found. Add one to get started.
          </p>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        name={deleteModal.title}
        title="Delete Knowledge Base Entry"
        onCancel={() => setDeleteModal({ isOpen: false, id: 0, title: "" })}
        onConfirm={handleConfirmDelete}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
