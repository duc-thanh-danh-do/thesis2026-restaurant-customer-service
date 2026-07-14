-- The service also takes a per-table PostgreSQL advisory lock. This partial
-- unique index is the final database-level guard against duplicate open dining
-- sessions created by concurrent processes or future code paths.
DROP INDEX IF EXISTS "dining_sessions_one_open_per_table";

CREATE UNIQUE INDEX "dining_sessions_one_open_per_table"
ON "dining_sessions" ("table_id")
WHERE lower("status") IN (
  'provisional',
  'active',
  'waiting_staff',
  'checkout_requested',
  'payment_pending',
  'paid',
  'closing'
);
