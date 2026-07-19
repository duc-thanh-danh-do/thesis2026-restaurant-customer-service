ALTER TABLE "knowledge_documents"
  ADD COLUMN IF NOT EXISTS "publication_status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "validation_results" JSONB,
  ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ai_instruction_versions" (
  "id" SERIAL NOT NULL,
  "restaurant_id" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "role_prompt" TEXT NOT NULL,
  "handover_prompt" TEXT NOT NULL,
  "release_notes" TEXT NOT NULL,
  "content" TEXT,
  "validation_results" JSONB,
  "validation_errors" JSONB,
  "test_results" JSONB,
  "created_by_staff_id" INTEGER NOT NULL,
  "created_by_id" INTEGER,
  "approved_by_staff_id" INTEGER,
  "approved_by_id" INTEGER,
  "validated_at" TIMESTAMP(3),
  "tested_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_instruction_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_instruction_versions_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Reconcile the earlier development-only instruction table without deleting it.
ALTER TABLE "ai_instruction_versions"
  ADD COLUMN IF NOT EXISTS "role_prompt" TEXT,
  ADD COLUMN IF NOT EXISTS "handover_prompt" TEXT,
  ADD COLUMN IF NOT EXISTS "release_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "validation_results" JSONB,
  ADD COLUMN IF NOT EXISTS "test_results" JSONB,
  ADD COLUMN IF NOT EXISTS "created_by_staff_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "approved_by_staff_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ai_instruction_versions"
SET
  "role_prompt" = COALESCE("role_prompt", "content", 'Use structured restaurant data and never invent facts.'),
  "handover_prompt" = COALESCE("handover_prompt", 'Hand over uncertain allergen and payment questions to staff.'),
  "release_notes" = COALESCE("release_notes", ''),
  "validation_results" = COALESCE("validation_results", "validation_errors"),
  "created_by_staff_id" = COALESCE(
    "created_by_staff_id",
    "created_by_id",
    (SELECT staff."id" FROM "staff_users" staff WHERE staff."restaurant_id" = "ai_instruction_versions"."restaurant_id" ORDER BY staff."id" LIMIT 1)
  ),
  "approved_by_staff_id" = COALESCE("approved_by_staff_id", "approved_by_id");

ALTER TABLE "ai_instruction_versions"
  ALTER COLUMN "role_prompt" SET NOT NULL,
  ALTER COLUMN "handover_prompt" SET NOT NULL,
  ALTER COLUMN "release_notes" SET NOT NULL,
  ALTER COLUMN "created_by_staff_id" SET NOT NULL;

-- Legacy development rows used one combined content field; new writes use the
-- explicit role and handover columns.
ALTER TABLE "ai_instruction_versions" ALTER COLUMN "content" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ai_instruction_versions_restaurant_id_version_key"
  ON "ai_instruction_versions"("restaurant_id", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_instruction_versions_one_published_per_restaurant"
  ON "ai_instruction_versions"("restaurant_id") WHERE "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "ai_instruction_versions_restaurant_id_status_updated_at_idx"
  ON "ai_instruction_versions"("restaurant_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "ai_instruction_versions_created_by_staff_id_idx"
  ON "ai_instruction_versions"("created_by_staff_id");
CREATE INDEX IF NOT EXISTS "ai_instruction_versions_approved_by_staff_id_idx"
  ON "ai_instruction_versions"("approved_by_staff_id");

ALTER TABLE "ai_response_logs" ADD COLUMN IF NOT EXISTS "instruction_version_id" INTEGER;
DO $$ BEGIN
  ALTER TABLE "ai_response_logs"
    ADD CONSTRAINT "ai_response_logs_instruction_version_id_fkey"
    FOREIGN KEY ("instruction_version_id") REFERENCES "ai_instruction_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "ai_response_logs_instruction_version_id_idx"
  ON "ai_response_logs"("instruction_version_id");

ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "restaurant_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "staff_user_id" INTEGER;
CREATE INDEX IF NOT EXISTS "audit_logs_restaurant_id_created_at_idx"
  ON "audit_logs"("restaurant_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_staff_user_id_idx"
  ON "audit_logs"("staff_user_id");

DROP INDEX IF EXISTS "knowledge_documents_restaurant_id_status_is_active_idx";
CREATE INDEX IF NOT EXISTS "knowledge_documents_restaurant_id_status_publication_status_is_active_idx"
  ON "knowledge_documents"("restaurant_id", "status", "publication_status", "is_active");
