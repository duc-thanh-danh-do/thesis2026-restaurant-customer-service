import assert from "node:assert/strict";
import test from "node:test";
import { validateKnowledgeDocumentFile } from "@/services/knowledge-document-validation";

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
