export const API_ROUTES = {
  CUSTOMER_SESSIONS: "/api/customer-sessions",
  CHAT_MESSAGES: "/api/chat/messages",
  RESTAURANT_MENU: (restaurantId: number) =>
    `/api/restaurants/${restaurantId}/menu-items`,
} as const;
