import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import {
  fallbackKnowledgeBase,
  fallbackMenuItems,
  fallbackRestaurant,
  isDatabaseUnavailable,
} from "@/lib/fallback-data";
import { buildCustomerContext, buildGeminiPrompt } from "@/lib/ai/chat-prompt";
import { logger } from "@/lib/logger";
import { createChatMessage } from "@/repositories/chat-message.repository";
import { findRestaurantContext } from "@/repositories/restaurant.repository";
import { generateAiText } from "@/services/ai-assistant.service";
import { createCustomerSession } from "@/services/customer-session.service";
import {
  createUnconfirmedOrder,
  serializeOrderDraft,
} from "@/services/customer-order.service";

const ACTIVE_SESSION_STATUSES = new Set(["active", "waiting_staff"]);
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const CONVERSATION_MEMORY_MESSAGE_LIMIT = 10;
const CONVERSATION_MEMORY_TOKEN_LIMIT = 1200;
const APPROX_CHARS_PER_TOKEN = 4;

export async function sendCustomerChatMessage({
  qrToken,
  sessionToken,
  allowSessionTokenOnly = false,
  message,
}: {
  qrToken?: string;
  sessionToken?: string | null;
  allowSessionTokenOnly?: boolean;
  message: string;
}) {
  try {
    const session = await resolveActiveChatSession({
      qrToken,
      sessionToken,
      allowSessionTokenOnly,
    });

    const customerMessage = await createChatMessage(
      session.id,
      "customer",
      message,
    );

    const restaurant = await findRestaurantContext(session.restaurantId);
    if (!restaurant) {
      throw new HttpError("Restaurant not found", "RESTAURANT_NOT_FOUND", 404);
    }

    const conversationHistory = await getConversationHistory(
      session.id,
      customerMessage.id,
    );
    const customerContext = await getCustomerContext(session.id);
    const groundedContext = buildGroundedContext(restaurant);
    const prompt = buildGeminiPrompt({
      groundedContext,
      customerContext,
      conversationHistory,
      customerMessage: message,
    });
    const reply = await generateReplyWithFallback({
      restaurant,
      groundedContext,
      message,
      prompt,
    });
    const handoverRequired = requiresStaffHandover(message);
    const orderToolResult = qrToken
      ? await maybeCreateOrderDraft({
          qrToken,
          sessionId: session.id,
          sessionToken: session.sessionToken,
          message,
          restaurant,
        })
      : null;
    const finalReply = orderToolResult
      ? buildOrderDraftReply(orderToolResult)
      : shouldHandleAsOrderRequest(message)
        ? buildUnresolvedOrderReply()
        : reply;

    const aiMessage = await createChatMessage(session.id, "ai", finalReply);

    await prisma.aiResponseLog.create({
      data: {
        sessionId: session.id,
        customerMessageId: customerMessage.id,
        aiMessageId: aiMessage.id,
        modelName: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
        retrievedContext: groundedContext,
        prompt,
        response: finalReply,
        handoverRequired,
        createdAt: new Date(),
      },
    });

    return {
      reply: finalReply,
      handoverRequired,
      requestId: null,
      sessionToken: session.sessionToken,
      sessionStatus: session.status,
      aiMessage,
      orderDraft: orderToolResult?.orderDraft ?? null,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;

    const groundedContext = buildFallbackGroundedContext();
    const prompt = buildGeminiPrompt({
      groundedContext,
      customerContext: "",
      conversationHistory: "",
      customerMessage: message,
    });
    const reply = normalizeReply(await generateAiText(prompt));
    const handoverRequired = requiresStaffHandover(message);

    return {
      reply,
      handoverRequired,
      requestId: null,
      sessionToken: sessionToken ?? null,
      sessionStatus: "active",
      aiMessage: {
        id: Date.now(),
        sessionId: 1,
        senderType: "ai",
        messageContent: reply,
        createdAt: new Date(),
      },
      orderDraft: null,
      fallback: true,
    };
  }
}

async function resolveActiveChatSession({
  qrToken,
  sessionToken,
  allowSessionTokenOnly,
}: {
  qrToken?: string;
  sessionToken?: string | null;
  allowSessionTokenOnly: boolean;
}) {
  if (qrToken) {
    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: qrToken },
    });

    if (!table) throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);
    if (!table.isActive) throw new HttpError("Restaurant table is inactive", "TABLE_INACTIVE", 400);

    const session = sessionToken
      ? await prisma.customerSession.findFirst({
          where: {
            sessionToken,
            tableId: table.id,
            status: { in: Array.from(ACTIVE_SESSION_STATUSES) },
          },
        })
      : null;

    return session ?? (await createCustomerSession(qrToken)).session;
  }

  if (!allowSessionTokenOnly) {
    throw new HttpError("QR token is required", "QR_TOKEN_REQUIRED", 400);
  }

  if (!sessionToken) {
    throw new HttpError("Session token is required for legacy chat", "SESSION_TOKEN_REQUIRED", 400);
  }

  const session = await prisma.customerSession.findUnique({
    where: { sessionToken },
  });

  if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);
  if (!ACTIVE_SESSION_STATUSES.has(session.status)) {
    throw new HttpError("Session is not active", "SESSION_NOT_ACTIVE", 400);
  }

  return session;
}

type RestaurantContext = Prisma.RestaurantGetPayload<{
  include: {
    menuItems: {
      include: {
        menuItemAllergens: {
          include: {
            allergen: true;
          };
        };
      };
    };
    knowledgeBase: true;
  };
}>;

function buildGroundedContext(restaurant: RestaurantContext) {
  const menuItems =
    restaurant.menuItems.length > 0
      ? restaurant.menuItems
          .map((item) => {
            const allergens = item.menuItemAllergens
              .map(({ allergen }) => allergen.name)
              .join(", ");

            return [
              `- ${item.name}`,
              `  Description: ${item.description ?? "Not available"}`,
              `  Category: ${item.category ?? "Not available"}`,
              `  Price: ${item.price.toString()}`,
              `  Available: ${item.isAvailable ? "yes" : "no"}`,
              `  Dietary tags: ${item.dietary ?? "None"}`,
              `  Ingredients: ${item.ingredients ?? "Not available"}`,
              `  Allergens: ${allergens || "None listed"}`,
            ].join("\n");
          })
          .join("\n\n")
      : "No menu items are available in the provided data.";

  const knowledgeBase =
    restaurant.knowledgeBase.length > 0
      ? restaurant.knowledgeBase
          .map((record) =>
            [
              `- ${record.title}`,
              `  Category: ${record.category ?? "Not available"}`,
              `  Content: ${record.content}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No active restaurant knowledge base records are available.";

  return [
    `Restaurant: ${restaurant.name}`,
    `Description: ${restaurant.description ?? "Not available"}`,
    `Address: ${restaurant.address ?? "Not available"}`,
    "",
    "Menu items:",
    menuItems,
    "",
    "Restaurant knowledge base:",
    knowledgeBase,
  ].join("\n");
}

async function getConversationHistory(
  sessionId: number,
  currentCustomerMessageId: number,
) {
  const previousMessages = await prisma.chatMessage.findMany({
    where: {
      sessionId,
      id: { lt: currentCustomerMessageId },
    },
    orderBy: { id: "desc" },
    take: CONVERSATION_MEMORY_MESSAGE_LIMIT,
  });

  return formatConversationHistory(previousMessages.reverse());
}

async function getCustomerContext(sessionId: number) {
  const session = await prisma.customerSession.findUnique({
    where: { id: sessionId },
    include: { table: true },
  });

  return buildCustomerContext({
    tableNumber: session?.table.tableNumber,
  });
}

function formatConversationHistory(
  messages: Array<{ senderType: string; messageContent: string }>,
) {
  if (messages.length === 0) return "";

  const lines = messages
    .filter(({ senderType }) =>
      ["customer", "ai", "staff"].includes(senderType),
    )
    .map(({ senderType, messageContent }) => {
      const label =
        senderType === "customer"
          ? "Customer"
          : senderType === "ai"
            ? "Assistant"
            : "Staff";

      return `${label}: ${messageContent.trim()}`;
    });

  const maxLength = CONVERSATION_MEMORY_TOKEN_LIMIT * APPROX_CHARS_PER_TOKEN;
  let history = lines.join("\n");

  while (history.length > maxLength && lines.length > 1) {
    lines.shift();
    history = lines.join("\n");
  }

  if (history.length <= maxLength) return history;

  return history.slice(history.length - maxLength).trimStart();
}

function buildFallbackGroundedContext() {
  const menuItems = fallbackMenuItems
    .map((item) => {
      const allergens = item.allergens.map((allergen) => allergen.name).join(", ");

      return [
        `- ${item.name}`,
        `  Description: ${item.description ?? "Not available"}`,
        `  Category: ${item.category ?? "Not available"}`,
        `  Price: ${item.price.toFixed(2)}`,
        `  Available: ${item.isAvailable ? "yes" : "no"}`,
        `  Dietary tags: ${item.dietary ?? "None"}`,
        `  Ingredients: ${item.ingredients ?? "Not available"}`,
        `  Allergens: ${allergens || "None listed"}`,
      ].join("\n");
    })
    .join("\n\n");

  const knowledgeBase = fallbackKnowledgeBase
    .map((record) =>
      [
        `- ${record.title}`,
        `  Category: ${record.category ?? "Not available"}`,
        `  Content: ${record.content}`,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `Restaurant: ${fallbackRestaurant.name}`,
    `Description: ${fallbackRestaurant.description ?? "Not available"}`,
    `Address: ${fallbackRestaurant.address ?? "Not available"}`,
    "",
    "Menu items:",
    menuItems,
    "",
    "Restaurant knowledge base:",
    knowledgeBase,
  ].join("\n");
}

async function generateReplyWithFallback({
  restaurant,
  groundedContext,
  message,
  prompt,
}: {
  restaurant: RestaurantContext;
  groundedContext: string;
  message: string;
  prompt: string;
}) {
  try {
    return normalizeReply(await generateAiText(prompt));
  } catch (error) {
    logger.error("Gemini failed for customer chat message", error);
    return buildDatabaseFallbackReply(restaurant, message, groundedContext);
  }
}

function buildDatabaseFallbackReply(
  restaurant: RestaurantContext,
  message: string,
  groundedContext: string,
) {
  const matchedItem = findMentionedMenuItem(restaurant, message);

  if (matchedItem) {
    const allergens = getAllergenNames(matchedItem);
    const hasAllergyConcern = /allerg|fish|gluten|soy|milk|dairy|egg|nut|peanut|shellfish|sesame/i.test(
      message,
    );

    if (hasAllergyConcern) {
      return [
        `I could not reach Gemini right now, but from the restaurant database: ${matchedItem.name} lists ${formatAllergenList(allergens)} as allergens.`,
        "Please confirm with restaurant staff before ordering, especially for allergies.",
      ].join(" ");
    }

    return [
      `I could not reach Gemini right now, but from the restaurant database: ${matchedItem.name} is ${matchedItem.isAvailable ? "available" : "not available"}.`,
      `Allergens listed: ${formatAllergenList(allergens)}.`,
    ].join(" ");
  }

  if (groundedContext.trim()) {
    return "I could not reach Gemini right now, but I can still use the restaurant database. Please ask again with the dish name, or ask restaurant staff for help.";
  }

  return "I could not reach Gemini right now. Please ask restaurant staff for help.";
}

function findMentionedMenuItem(restaurant: RestaurantContext, message: string) {
  const normalizedMessage = normalizeSearchText(message);

  return restaurant.menuItems.find((item) => {
    const normalizedName = normalizeSearchText(item.name);
    return normalizedMessage.includes(normalizedName);
  });
}

function getAllergenNames(item: RestaurantContext["menuItems"][number]) {
  return item.menuItemAllergens.map(({ allergen }) => allergen.name);
}

function formatAllergenList(allergens: string[]) {
  return allergens.length > 0 ? allergens.join(", ") : "none";
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeReply(reply: string) {
  const trimmedReply = reply.trim();
  return trimmedReply || "I do not have enough information in the provided restaurant data to answer that.";
}

async function maybeCreateOrderDraft({
  qrToken,
  sessionId,
  sessionToken,
  message,
  restaurant,
}: {
  qrToken: string;
  sessionId: number;
  sessionToken: string;
  message: string;
  restaurant: RestaurantContext;
}) {
  const orderRequest = await extractOrderRequest({
    sessionId,
    restaurant,
    message,
  });
  if (!orderRequest) return null;

  const result = await createUnconfirmedOrder({
    qrToken,
    sessionToken,
    items: {
      [String(orderRequest.menuItemId)]: orderRequest.quantity,
    },
  });

  return {
    itemName: orderRequest.name,
    quantity: orderRequest.quantity,
    orderDraft: serializeOrderDraft(result.order),
  };
}

async function extractOrderRequest({
  sessionId,
  restaurant,
  message,
}: {
  sessionId: number;
  restaurant: RestaurantContext;
  message: string;
}) {
  const normalizedMessage = normalizeSearchText(message);
  const matchedItem = restaurant.menuItems.find((item) => {
    if (!item.isAvailable) return false;

    return normalizedMessage.includes(normalizeSearchText(item.name));
  });

  if (matchedItem && shouldHandleAsOrderRequest(message)) {
    return {
      menuItemId: matchedItem.id,
      name: matchedItem.name,
      quantity: extractQuantity(message),
    };
  }

  if (!isRepeatOrderRequest(message)) return null;

  const latestDraftItem = await findLatestDraftOrderItem(sessionId);
  if (!latestDraftItem) return null;

  const repeatedMenuItem = restaurant.menuItems.find(
    (item) =>
      item.isAvailable &&
      normalizeSearchText(item.name) === normalizeSearchText(latestDraftItem.name),
  );

  if (!repeatedMenuItem) return null;

  return {
    menuItemId: repeatedMenuItem.id,
    name: repeatedMenuItem.name,
    quantity: extractQuantity(message),
  };
}

async function findLatestDraftOrderItem(sessionId: number) {
  const latestDraft = await prisma.order.findFirst({
    where: {
      sessionId,
      status: "unconfirmed",
    },
    include: {
      orderItems: {
        orderBy: { id: "desc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return latestDraft?.orderItems[0] ?? null;
}

function shouldHandleAsOrderRequest(message: string) {
  return hasExplicitOrderIntent(message) || hasAdditiveOrderIntent(message);
}

function hasExplicitOrderIntent(message: string) {
  return /\b(add|order|get|want|take|bring|can i get|can i have|i'll have|i would like|i want)\b/i.test(
    message,
  );
}

function hasAdditiveOrderIntent(message: string) {
  return /^(and|also|plus)\b/i.test(message) || isRepeatOrderRequest(message);
}

function isRepeatOrderRequest(message: string) {
  return /\b(one more|another|same|more please|one more please|add one more)\b/i.test(
    message,
  );
}

function extractQuantity(message: string) {
  const numericQuantity = message.match(/\b([1-9]\d*)\b/);
  if (numericQuantity) return Number(numericQuantity[1]);

  const quantityWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const normalizedMessage = normalizeSearchText(message);
  const matchedWord = Object.entries(quantityWords).find(([word]) =>
    normalizedMessage.split(" ").includes(word),
  );

  return matchedWord?.[1] ?? 1;
}

function buildOrderDraftReply({
  itemName,
  quantity,
}: {
  itemName: string;
  quantity: number;
}) {
  return `I added ${quantity}x ${itemName} to your order draft. Please review and confirm it before we send it to the restaurant.`;
}

function buildUnresolvedOrderReply() {
  return "I could not add that to your order draft yet. Please include the exact dish name from the menu, and I will prepare it for you to review.";
}

function requiresStaffHandover(message: string) {
  return /\b(allerg\w*|bill|pay|payment|complaint|manager|staff|help)\b/i.test(
    message,
  );
}
