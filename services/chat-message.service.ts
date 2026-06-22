import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import {
  fallbackKnowledgeBase,
  fallbackMenuItems,
  fallbackRestaurant,
  isDatabaseUnavailable,
} from "@/lib/fallback-data";
import { logger } from "@/lib/logger";
import { createChatMessage } from "@/repositories/chat-message.repository";
import { findRestaurantContext } from "@/repositories/restaurant.repository";
import { generateAiText } from "@/services/ai-assistant.service";

const ACTIVE_SESSION_STATUSES = new Set(["active", "waiting_staff"]);
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export async function sendCustomerChatMessage(
  sessionToken: string,
  message: string,
) {
  try {
    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
    });

    if (!session) throw new HttpError("Session not found", "SESSION_NOT_FOUND", 404);
    if (!ACTIVE_SESSION_STATUSES.has(session.status)) {
      throw new HttpError("Session is not active", "SESSION_NOT_ACTIVE", 400);
    }

    const customerMessage = await createChatMessage(
      session.id,
      "customer",
      message,
    );

    const restaurant = await findRestaurantContext(session.restaurantId);
    if (!restaurant) {
      throw new HttpError("Restaurant not found", "RESTAURANT_NOT_FOUND", 404);
    }

    const groundedContext = buildGroundedContext(restaurant);
    const prompt = buildGeminiPrompt(groundedContext, message);
    const reply = await generateReplyWithFallback({
      restaurant,
      groundedContext,
      message,
      prompt,
    });
    const handoverRequired = requiresStaffHandover(message);

    const aiMessage = await createChatMessage(session.id, "ai", reply);

    await prisma.aiResponseLog.create({
      data: {
        sessionId: session.id,
        customerMessageId: customerMessage.id,
        aiMessageId: aiMessage.id,
        modelName: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
        retrievedContext: groundedContext,
        prompt,
        response: reply,
        handoverRequired,
        createdAt: new Date(),
      },
    });

    return {
      reply,
      handoverRequired,
      requestId: null,
      sessionStatus: session.status,
      aiMessage,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;

    const groundedContext = buildFallbackGroundedContext();
    const prompt = buildGeminiPrompt(groundedContext, message);
    const reply = normalizeReply(await generateAiText(prompt));
    const handoverRequired = requiresStaffHandover(message);

    return {
      reply,
      handoverRequired,
      requestId: null,
      sessionStatus: "active",
      aiMessage: {
        id: Date.now(),
        sessionId: 1,
        senderType: "ai",
        messageContent: reply,
        createdAt: new Date(),
      },
      fallback: true,
    };
  }
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

function buildGeminiPrompt(groundedContext: string, customerMessage: string) {
  return [
    "You are a friendly restaurant waiter helping a customer at their table.",
    "Use only the grounded restaurant context from the database below.",
    "The context includes restaurant information, menu items, allergens for each menu item, and active restaurant knowledge base records.",
    "Answer simply, naturally, and briefly.",
    "Do not invent menu items, prices, allergens, availability, ingredients, opening hours, or policies.",
    "If the database context does not contain the answer, say that you do not have that information and offer to ask staff.",
    "For allergy questions, summarize listed allergens but do not guarantee safety; recommend confirming with restaurant staff.",
    "For payment, complaints, staff help, or sensitive allergy confirmation, explain that staff should assist.",
    "",
    "Grounded restaurant context:",
    groundedContext,
    "",
    `Customer message: ${customerMessage}`,
  ].join("\n");
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

function requiresStaffHandover(message: string) {
  return /\b(allerg\w*|bill|pay|payment|complaint|manager|staff|help)\b/i.test(
    message,
  );
}
