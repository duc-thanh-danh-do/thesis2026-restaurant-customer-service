CREATE INDEX IF NOT EXISTS "customer_sessions_restaurant_id_idx"
ON "customer_sessions" ("restaurant_id");

CREATE INDEX IF NOT EXISTS "ai_response_logs_session_id_id_idx"
ON "ai_response_logs" ("session_id", "id");
