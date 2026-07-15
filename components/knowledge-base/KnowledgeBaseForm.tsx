"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createKnowledgeBaseEntryAction,
  updateKnowledgeBaseEntryAction,
  getKnowledgeBaseEntryAction,
} from "@/actions/knowledge-base.action";
import Toast, { useToast } from "@/components/ui/Toast";

const CATEGORIES = [
  "allergy",
  "menu",
  "policy",
  "operations",
  "faq",
  "general",
];

export default function KnowledgeBaseForm({ entryId }: { entryId?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toastMessage, showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!!entryId);

  useEffect(() => {
    if (!entryId) return;
    getKnowledgeBaseEntryAction(entryId).then((entry) => {
      if (entry) {
        setTitle(entry.title);
        setContent(entry.content);
        setCategory(entry.category || "");
        setIsActive(entry.isActive);
      }
      setLoading(false);
    });
  }, [entryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showToast("Title and content are required");
      return;
    }

    startTransition(async () => {
      let result;
      if (entryId) {
        result = await updateKnowledgeBaseEntryAction(entryId, {
          title: title.trim(),
          content: content.trim(),
          category: category || undefined,
          isActive,
        });
      } else {
        result = await createKnowledgeBaseEntryAction({
          title: title.trim(),
          content: content.trim(),
          category: category || undefined,
        });
      }

      if (result.success) {
        showToast(entryId ? "Entry updated" : "Entry created");
        router.push("/knowledge-base");
      } else {
        showToast(result.error || "Failed to save");
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-155 mx-auto py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-155 mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {entryId ? "Edit entry" : "New knowledge base entry"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Add context that helps the AI assistant answer customer questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-5 bg-white border border-[#d5e1ec] rounded-[20px] space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#142653]">Title</Label>
            <Input
              placeholder="e.g. Allergy policy for gluten-free options"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              className="border-[#d5e1ec] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#142653]">
              Content
            </Label>
            <textarea
              placeholder="Write the knowledge base entry content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              rows={8}
              className="w-full rounded-lg border border-[#d5e1ec] px-3 py-2 text-sm outline-none focus:border-blue-500 resize-y disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#142653]">
              Category
            </Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? "" : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {entryId != null && entryId > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="isActive" className="text-sm text-[#142653]">
                Active (included in AI context)
              </Label>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-6"
          >
            {isPending
              ? "Saving..."
              : entryId
                ? "Update entry"
                : "Create entry"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/knowledge-base")}
            disabled={isPending}
            className="rounded-lg px-6"
          >
            Cancel
          </Button>
        </div>
      </form>

      <Toast message={toastMessage} />
    </div>
  );
}
