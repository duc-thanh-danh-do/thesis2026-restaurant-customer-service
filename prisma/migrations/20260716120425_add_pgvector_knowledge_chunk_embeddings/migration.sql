CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "knowledge_document_chunks"
ADD COLUMN "embedding" vector(768);

CREATE INDEX "knowledge_document_chunks_embedding_cosine_idx"
ON "knowledge_document_chunks"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100)
WHERE "embedding" IS NOT NULL;
