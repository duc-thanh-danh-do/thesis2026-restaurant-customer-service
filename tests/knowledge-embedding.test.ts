import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocumentEmbeddingInput,
  buildQueryEmbeddingInput,
  formatPgVector,
} from "@/services/knowledge-embedding.service";

test("formats document chunks for Gemini embedding retrieval", () => {
  assert.equal(
    buildDocumentEmbeddingInput({
      title: "allergy-guide.pdf",
      content: "Fish allergy questions must be confirmed by staff.",
    }),
    "title: allergy-guide.pdf | text: Fish allergy questions must be confirmed by staff.",
  );
});

test("formats customer queries for Gemini embedding retrieval", () => {
  assert.equal(
    buildQueryEmbeddingInput("Does tuna pizza contain fish?"),
    "task: question answering | query: Does tuna pizza contain fish?",
  );
});

test("formats embeddings for pgvector", () => {
  assert.equal(formatPgVector([0.1, -0.2, 0]), "[0.1,-0.2,0]");
});

test("rejects non-finite pgvector values", () => {
  assert.throws(() => formatPgVector([0.1, Number.NaN]), /non-finite/);
});
