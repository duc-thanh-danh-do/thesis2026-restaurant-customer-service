import assert from "node:assert/strict";
import test from "node:test";
import { validateKnowledgeDocumentFile } from "@/services/knowledge-document-validation";
import {
  chunkKnowledgeDocumentText,
  normalizeKnowledgeDocumentText,
} from "@/services/knowledge-document-ingestion.service";

test("accepts PDF knowledge documents", () => {
  const file = new File(["%PDF-1.7"], "allergy-policy.pdf", {
    type: "application/pdf",
  });

  assert.doesNotThrow(() => validateKnowledgeDocumentFile(file));
});

test("rejects unsupported knowledge document extensions", () => {
  const file = new File(["hello"], "notes.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.throws(
    () => validateKnowledgeDocumentFile(file),
    /Only \.txt, \.md, and \.pdf knowledge documents are supported/,
  );
});

test("normalizes document text before retrieval indexing", () => {
  assert.equal(
    normalizeKnowledgeDocumentText("\uFEFFPolicy\r\n\r\n\r\n-- 1 of 2 --\r\nNo guarantees. \t\r\n"),
    "Policy\n\nNo guarantees.",
  );
});

test("chunks knowledge at readable boundaries without losing content", () => {
  const text = "First policy sentence. Second policy sentence. Third policy sentence.";
  const chunks = chunkKnowledgeDocumentText(text, 32);

  assert.ok(chunks.length > 1);
  assert.equal(chunks.join(" "), text);
  assert.ok(chunks.every((chunk) => chunk.length <= 32));
});
