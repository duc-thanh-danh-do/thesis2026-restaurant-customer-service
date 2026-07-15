-- CreateTable
CREATE TABLE "dining_sessions" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "table_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "dining_sessions_pkey" PRIMARY KEY ("id")
);

-- Add nullable column for backfill.
ALTER TABLE "customer_sessions" ADD COLUMN "dining_session_id" INTEGER;

-- Backfill one active dining session per table for existing active customer sessions.
INSERT INTO "dining_sessions" ("restaurant_id", "table_id", "status", "started_at", "ended_at")
SELECT
    "restaurant_id",
    "table_id",
    CASE
        WHEN BOOL_OR("status" = 'waiting_staff') THEN 'waiting_staff'
        ELSE 'active'
    END AS "status",
    MIN("started_at") AS "started_at",
    NULL AS "ended_at"
FROM "customer_sessions"
WHERE "status" IN ('active', 'waiting_staff')
GROUP BY "restaurant_id", "table_id";

-- Backfill historical/closed dining sessions grouped by table and status.
INSERT INTO "dining_sessions" ("restaurant_id", "table_id", "status", "started_at", "ended_at")
SELECT
    "restaurant_id",
    "table_id",
    "status",
    MIN("started_at") AS "started_at",
    MAX("ended_at") AS "ended_at"
FROM "customer_sessions"
WHERE "status" NOT IN ('active', 'waiting_staff')
GROUP BY "restaurant_id", "table_id", "status";

-- Link active customer sessions to their table's active dining session.
UPDATE "customer_sessions"
SET "dining_session_id" = "dining_sessions"."id"
FROM "dining_sessions"
WHERE "customer_sessions"."restaurant_id" = "dining_sessions"."restaurant_id"
  AND "customer_sessions"."table_id" = "dining_sessions"."table_id"
  AND "customer_sessions"."status" IN ('active', 'waiting_staff')
  AND "dining_sessions"."status" IN ('active', 'waiting_staff');

-- Link historical/closed customer sessions to matching historical dining sessions.
UPDATE "customer_sessions"
SET "dining_session_id" = "dining_sessions"."id"
FROM "dining_sessions"
WHERE "customer_sessions"."restaurant_id" = "dining_sessions"."restaurant_id"
  AND "customer_sessions"."table_id" = "dining_sessions"."table_id"
  AND "customer_sessions"."status" = "dining_sessions"."status"
  AND "customer_sessions"."status" NOT IN ('active', 'waiting_staff');

-- If any unexpected legacy status remains unlinked, create a closed dining session for it.
INSERT INTO "dining_sessions" ("restaurant_id", "table_id", "status", "started_at", "ended_at")
SELECT "restaurant_id", "table_id", 'closed', MIN("started_at"), MAX("ended_at")
FROM "customer_sessions"
WHERE "dining_session_id" IS NULL
GROUP BY "restaurant_id", "table_id";

WITH fallback_dining_sessions AS (
    SELECT DISTINCT ON ("restaurant_id", "table_id")
        "id",
        "restaurant_id",
        "table_id"
    FROM "dining_sessions"
    WHERE "status" = 'closed'
    ORDER BY "restaurant_id", "table_id", "id" DESC
)
UPDATE "customer_sessions"
SET "dining_session_id" = fallback_dining_sessions."id"
FROM fallback_dining_sessions
WHERE "customer_sessions"."restaurant_id" = fallback_dining_sessions."restaurant_id"
  AND "customer_sessions"."table_id" = fallback_dining_sessions."table_id"
  AND "customer_sessions"."dining_session_id" IS NULL;

ALTER TABLE "customer_sessions" ALTER COLUMN "dining_session_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dining_sessions_one_active_per_table_idx"
ON "dining_sessions"("table_id")
WHERE "status" IN ('active', 'waiting_staff');

-- AddForeignKey
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_dining_session_id_fkey" FOREIGN KEY ("dining_session_id") REFERENCES "dining_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
