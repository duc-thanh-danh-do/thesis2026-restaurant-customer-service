import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-errors";
import {
  fallbackKnowledgeBase,
  fallbackMenuItems,
  fallbackRestaurant,
  isDatabaseUnavailable,
} from "@/lib/fallback-data";
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
    const reply = normalizeReply(await generateAiText(prompt));
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
              `  Vegetarian: ${item.isVegetarian ? "yes" : "no"}`,
              `  Vegan: ${item.isVegan ? "yes" : "no"}`,
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
    "You are a restaurant customer-service assistant.",
    "Answer concisely and helpfully using only the restaurant data provided below.",
    "Do not invent menu items, prices, allergens, availability, ingredients, or policies.",
    "If the answer is not available in the provided data, say that the information is not available.",
    "For allergy questions, do not guarantee safety; recommend confirmation with restaurant staff.",
    "If the customer asks for payment, staff help, complaint handling, or sensitive allergy confirmation, politely say staff may need to assist.",
    "",
    "Provided restaurant data:",
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
        `  Vegetarian: ${item.isVegetarian ? "yes" : "no"}`,
        `  Vegan: ${item.isVegan ? "yes" : "no"}`,
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

function normalizeReply(reply: string) {
  const trimmedReply = reply.trim();
  return trimmedReply || "I do not have enough information in the provided restaurant data to answer that.";
}

function requiresStaffHandover(message: string) {
  return /\b(allerg|bill|pay|payment|complaint|manager|staff|help)\b/i.test(
    message,
  );
}
