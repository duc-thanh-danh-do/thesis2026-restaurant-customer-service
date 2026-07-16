import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRetrievedKnowledgeLog,
  buildKeywordPattern,
  extractSearchTerms,
  formatRetrievedKnowledge,
} from "@/services/knowledge-retrieval.service";

test("extracts useful search terms from a customer question", () => {
  assert.deepEqual(
    extractSearchTerms("Can you tell me about gluten-free payment options, please?"),
    ["tell", "gluten", "free", "payment", "options"],
  );
});

test("builds keyword patterns for fallback matching", () => {
  assert.equal(buildKeywordPattern(["gluten", "free"]), "%gluten%free%");
});

test("formats retrieved manual entries and document chunks for prompts", () => {
  const formatted = formatRetrievedKnowledge({
    entries: [
      {
        id: 1,
        title: "Allergy policy",
        category: "allergy",
        content: "Staff must confirm allergy questions.",
        score: 1,
      },
    ],
    documentChunks: [
      {
        id: 2,
        documentId: 3,
        documentTitle: "faq.md",
        chunkIndex: 0,
        content: "Payment is available by card or cash.",
        score: 1,
      },
    ],
  });

  assert.match(formatted, /Manual knowledge base matches/);
  assert.match(formatted, /Allergy policy/);
  assert.match(formatted, /Uploaded document matches/);
  assert.match(formatted, /faq\.md \(chunk 1\)/);
});

test("builds structured retrieved knowledge logs for observability", () => {
  const log = buildRetrievedKnowledgeLog({
    entries: [
      {
        id: 1,
        title: "Allergy policy",
        category: "allergy",
        content: "Staff must confirm allergy questions.",
        score: 0.75,
      },
    ],
    documentChunks: [
      {
        id: 2,
        documentId: 3,
        documentTitle: "faq.pdf",
        chunkIndex: 1,
        content: "Payment is available by card or cash.",
        score: 0.5,
      },
    ],
  });

  assert.equal(log.manualEntries[0].title, "Allergy policy");
  assert.equal(log.documentChunks[0].documentTitle, "faq.pdf");
  assert.equal(log.documentChunks[0].chunkIndex, 1);
});
