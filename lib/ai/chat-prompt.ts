export type CustomerPromptContext = {
  tableNumber?: string | null;
};

export function buildCustomerContext(context: CustomerPromptContext) {
  const tableNumber = context.tableNumber?.trim();

  if (!tableNumber) return "";

  return ["Customer context:", `- Table number: ${tableNumber}`].join("\n");
}

export function buildGeminiPrompt({
  groundedContext,
  customerContext,
  conversationHistory,
  customerMessage,
}: {
  groundedContext: string;
  customerContext: string;
  conversationHistory: string;
  customerMessage: string;
}) {
  return [
    "You are a restaurant customer-service assistant.",
    "Answer concisely and helpfully using only the restaurant data provided below.",
    "Do not invent menu items, prices, allergens, availability, ingredients, or policies.",
    "If the answer is not available in the provided data, say that the information is not available.",
    "For allergy questions, do not guarantee safety; recommend confirmation with restaurant staff.",
    "If the customer asks for payment, staff help, complaint handling, or sensitive allergy confirmation, politely say staff may need to assist.",
    "Do not say that staff have been notified or that an action has been completed unless the system explicitly confirms it.",
    "Do not say that an order was added, updated, confirmed, or sent unless the system explicitly confirms it with an order draft or order status.",
    "Use the conversation history only to understand references, preferences, or follow-up wording such as that pizza, the cheaper one, or the same allergen.",
    "Keep memory scoped to this dining session only. Do not assume long-term customer memory.",
    "",
    "Provided restaurant data:",
    groundedContext,
    "",
    customerContext,
    customerContext ? "" : null,
    "Conversation so far:",
    conversationHistory || "No previous messages in this dining session.",
    "",
    `Customer message: ${customerMessage}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
