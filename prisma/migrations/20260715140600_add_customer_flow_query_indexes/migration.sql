CREATE INDEX IF NOT EXISTS "customer_sessions_table_id_status_idx"
ON "customer_sessions" ("table_id", "status");

CREATE INDEX IF NOT EXISTS "customer_sessions_dining_session_id_idx"
ON "customer_sessions" ("dining_session_id");

CREATE INDEX IF NOT EXISTS "chat_messages_session_id_id_idx"
ON "chat_messages" ("session_id", "id");

CREATE INDEX IF NOT EXISTS "customer_requests_session_id_created_at_idx"
ON "customer_requests" ("session_id", "created_at");

CREATE INDEX IF NOT EXISTS "menu_items_restaurant_id_is_available_idx"
ON "menu_items" ("restaurant_id", "is_available");

CREATE INDEX IF NOT EXISTS "restaurant_knowledge_base_restaurant_id_is_active_idx"
ON "restaurant_knowledge_base" ("restaurant_id", "is_active");

CREATE INDEX IF NOT EXISTS "orders_session_id_status_created_at_idx"
ON "orders" ("session_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx"
ON "order_items" ("order_id");
