-- CreateTable
CREATE TABLE "handover_rules" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "request_type" VARCHAR(100) NOT NULL,
    "keywords" JSONB NOT NULL,
    "response_message" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "handover_rules_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ai_response_logs"
ADD COLUMN "handover_reason" TEXT,
ADD COLUMN "handover_rule_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "handover_rules_restaurant_id_name_key"
ON "handover_rules"("restaurant_id", "name");

-- CreateIndex
CREATE INDEX "handover_rules_restaurant_id_is_active_priority_idx"
ON "handover_rules"("restaurant_id", "is_active", "priority");

-- CreateIndex
CREATE INDEX "ai_response_logs_handover_rule_id_idx"
ON "ai_response_logs"("handover_rule_id");

-- AddForeignKey
ALTER TABLE "handover_rules"
ADD CONSTRAINT "handover_rules_restaurant_id_fkey"
FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_response_logs"
ADD CONSTRAINT "ai_response_logs_handover_rule_id_fkey"
FOREIGN KEY ("handover_rule_id") REFERENCES "handover_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
