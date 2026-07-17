ALTER TABLE "knowledge_documents"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "knowledge_documents_restaurant_id_status_idx";

CREATE INDEX "knowledge_documents_restaurant_id_status_is_active_idx"
ON "knowledge_documents"("restaurant_id", "status", "is_active");
