import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_SESSION_STATUSES = new Set(['active', 'waiting_staff']);
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async sendMessage(sessionToken: string, message: string) {
    const session = await this.prisma.customerSession.findUnique({
      where: {
        sessionToken,
      },
    });

    if (!session) {
      throwApiError('Session not found', 'SESSION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (!ACTIVE_SESSION_STATUSES.has(session.status)) {
      throwApiError(
        'Session is not active',
        'SESSION_NOT_ACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customerMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'customer',
        messageContent: message,
        createdAt: new Date(),
      },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: session.restaurantId,
      },
      include: {
        menuItems: {
          include: {
            menuItemAllergens: {
              include: {
                allergen: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
        knowledgeBase: {
          where: {
            isActive: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!restaurant) {
      throwApiError(
        'Restaurant not found',
        'RESTAURANT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    const groundedContext = buildGroundedContext(restaurant);
    const prompt = buildGeminiPrompt(groundedContext, message);
    const reply = normalizeReply(await this.aiService.generateText(prompt));
    const handoverRequired = false;
    const requestId = null;

    const aiMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'ai',
        messageContent: reply,
        createdAt: new Date(),
      },
    });

    await this.prisma.aiResponseLog.create({
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
      requestId,
      sessionStatus: session.status,
      aiMessage,
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
              .join(', ');

            return [
              `- ${item.name}`,
              `  Description: ${item.description ?? 'Not available'}`,
              `  Category: ${item.category ?? 'Not available'}`,
              `  Price: ${item.price.toString()}`,
              `  Available: ${item.isAvailable ? 'yes' : 'no'}`,
              `  Vegetarian: ${item.isVegetarian ? 'yes' : 'no'}`,
              `  Vegan: ${item.isVegan ? 'yes' : 'no'}`,
              `  Ingredients: ${item.ingredients ?? 'Not available'}`,
              `  Allergens: ${allergens || 'None listed'}`,
            ].join('\n');
          })
          .join('\n\n')
      : 'No menu items are available in the provided data.';

  const knowledgeBase =
    restaurant.knowledgeBase.length > 0
      ? restaurant.knowledgeBase
          .map((record) =>
            [
              `- ${record.title}`,
              `  Category: ${record.category ?? 'Not available'}`,
              `  Content: ${record.content}`,
            ].join('\n'),
          )
          .join('\n\n')
      : 'No active restaurant knowledge base records are available.';

  return [
    `Restaurant: ${restaurant.name}`,
    `Description: ${restaurant.description ?? 'Not available'}`,
    `Address: ${restaurant.address ?? 'Not available'}`,
    '',
    'Menu items:',
    menuItems,
    '',
    'Restaurant knowledge base:',
    knowledgeBase,
  ].join('\n');
}

function buildGeminiPrompt(groundedContext: string, customerMessage: string) {
  return [
    'You are a restaurant customer-service assistant.',
    'Answer concisely and helpfully using only the restaurant data provided below.',
    'Do not invent menu items, prices, allergens, availability, ingredients, or policies.',
    'If the answer is not available in the provided data, say that the information is not available.',
    'For allergy questions, do not guarantee safety; recommend confirmation with restaurant staff.',
    'If the customer asks for payment, staff help, complaint handling, or sensitive allergy confirmation, politely say staff may need to assist.',
    '',
    'Provided restaurant data:',
    groundedContext,
    '',
    `Customer message: ${customerMessage}`,
  ].join('\n');
}

function normalizeReply(reply: string) {
  const trimmedReply = reply.trim();

  if (trimmedReply.length > 0) {
    return trimmedReply;
  }

  return 'I do not have enough information in the provided restaurant data to answer that.';
}

function throwApiError(
  message: string,
  code: string,
  status: HttpStatus,
): never {
  throw new HttpException({ message, code }, status);
}
