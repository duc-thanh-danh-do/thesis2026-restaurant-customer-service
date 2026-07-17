const ACCEPTED_EXTENSIONS = new Set([".txt", ".md", ".pdf"]);
const ACCEPTED_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "application/pdf",
  "text/markdown",
  "text/plain",
  "text/x-markdown",
]);
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export function validateKnowledgeDocumentFile(file: File) {
  const extension = getKnowledgeDocumentFileExtension(file.name);

  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    throw new Error("Only .txt, .md, and .pdf knowledge documents are supported.");
  }

  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new Error("Only plain text, Markdown, and PDF files are supported.");
  }

  if (file.size <= 0) {
    throw new Error("Document is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Document is too large. Maximum size is 2 MB.");
  }
}

export function getKnowledgeDocumentFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "";

  return fileName.slice(lastDotIndex).toLowerCase();
}
