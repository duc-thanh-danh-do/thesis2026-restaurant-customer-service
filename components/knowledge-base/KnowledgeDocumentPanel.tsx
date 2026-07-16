"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import {
  getKnowledgeDocumentsAction,
  uploadKnowledgeDocumentAction,
  type KnowledgeDocument,
} from "@/actions/knowledge-document.action";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Toast, { useToast } from "@/components/ui/Toast";

export default function KnowledgeDocumentPanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toastMessage, showToast } = useToast();

  const fetchDocuments = useCallback(async () => {
    const data = await getKnowledgeDocumentsAction();
    setDocuments(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Choose a .txt, .md, or .pdf file first");
      return;
    }

    const formData = new FormData();
    formData.set("file", selectedFile);

    startTransition(async () => {
      const result = await uploadKnowledgeDocumentAction(formData);

      if (result.success) {
        showToast(`Uploaded ${selectedFile.name}`);
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
        fetchDocuments();
      } else {
        showToast(result.error ?? "Upload failed");
        fetchDocuments();
      }
    });
  };

  return (
    <section className="space-y-3">
      <Card className="bg-white border border-[#d5e1ec] rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#142653]" aria-hidden="true" />
              <h2 className="font-semibold text-[#142653]">Knowledge documents</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Upload plain text, Markdown, or PDF files for AI knowledge ingestion.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-w-0 cursor-pointer items-center justify-center rounded-lg border border-[#d5e1ec] bg-[#f5f9fc] px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.pdf,text/plain,text/markdown,text/x-markdown,application/pdf"
                className="sr-only"
                disabled={isPending}
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
              <span className="truncate">
                {selectedFile ? selectedFile.name : "Choose .txt, .md, or .pdf"}
              </span>
            </label>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isPending}
              className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-4"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              Upload
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          DOCUMENTS ({documents.length})
        </div>
        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#d5e1ec] bg-white px-4 py-6 text-center text-sm text-gray-400">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((document) => (
            <Card
              key={document.id}
              className="bg-white border border-[#d5e1ec] rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-[#142653]">
                      {document.originalFilename}
                    </h3>
                    <StatusBadge status={document.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatFileSize(document.fileSize)} · {document.mimeType} ·{" "}
                    {document.chunkCount} chunks
                  </p>
                  {document.errorMessage ? (
                    <p className="mt-2 text-sm text-red-600">
                      {document.errorMessage}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-xs text-gray-400">
                  {document.updatedAt
                    ? new Date(document.updatedAt).toLocaleDateString()
                    : "No date"}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <Toast message={toastMessage} />
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Ready
      </span>
    );
  }

  if (normalizedStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      Processing
    </span>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
