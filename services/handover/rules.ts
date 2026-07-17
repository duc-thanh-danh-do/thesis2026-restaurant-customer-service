import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/fallback-data";
import { logger } from "@/lib/logger";
import { DEFAULT_HANDOVER_RULES } from "@/services/handover/default-rules";
import { isLowConfidenceReply, normalizeSearchText } from "@/services/handover/text";
import {
  LOW_CONFIDENCE_KEYWORD,
  type HandoverDecision,
  type HandoverRule,
  type HandoverRuleRow,
} from "@/services/handover/types";

export async function evaluateHandover({
  restaurantId,
  message,
  assistantReply,
}: {
  restaurantId?: number | null;
  message: string;
  assistantReply?: string | null;
}): Promise<HandoverDecision> {
  const rules = restaurantId
    ? await getHandoverRulesForRestaurant(restaurantId)
    : DEFAULT_HANDOVER_RULES;
  const normalizedMessage = normalizeSearchText(message);
  const lowConfidence = isLowConfidenceReply(assistantReply);

  const matchedRule = rules
    .sort((a, b) => b.priority - a.priority)
    .find((rule) =>
      rule.keywords.some((keyword) =>
        keyword === LOW_CONFIDENCE_KEYWORD
          ? lowConfidence
          : normalizedMessage.includes(normalizeSearchText(keyword)),
      ),
    );

  if (!matchedRule) return emptyDecision();

  return {
    required: true,
    ruleId: matchedRule.id,
    ruleName: matchedRule.name,
    category: matchedRule.category,
    requestType: matchedRule.requestType,
    reason: matchedRule.responseMessage,
    responseMessage: matchedRule.responseMessage,
  };
}

export function shouldHandoverByDefault(message: string) {
  const normalizedMessage = normalizeSearchText(message);

  return DEFAULT_HANDOVER_RULES.some((rule) =>
    rule.keywords.some(
      (keyword) =>
        keyword !== LOW_CONFIDENCE_KEYWORD &&
        normalizedMessage.includes(normalizeSearchText(keyword)),
    ),
  );
}

function emptyDecision(): HandoverDecision {
  return {
    required: false,
    ruleId: null,
    ruleName: null,
    category: null,
    requestType: null,
    reason: null,
    responseMessage: null,
  };
}

async function getHandoverRulesForRestaurant(restaurantId: number) {
  try {
    const rows = await prisma.$queryRaw<HandoverRuleRow[]>`
      SELECT
        "id",
        "name",
        "category",
        "request_type" AS "requestType",
        "keywords",
        "response_message" AS "responseMessage",
        "priority"
      FROM "handover_rules"
      WHERE "restaurant_id" = ${restaurantId}
        AND "is_active" = true
      ORDER BY "priority" DESC, "id" ASC
    `;

    const rules = rows.map(normalizeRuleRow).filter((rule) => rule.keywords.length > 0);
    return rules.length > 0 ? rules : DEFAULT_HANDOVER_RULES;
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      logger.error("Failed to load handover rules; using defaults", error);
    }
    return DEFAULT_HANDOVER_RULES;
  }
}

function normalizeRuleRow(row: HandoverRuleRow): HandoverRule {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    requestType: row.requestType,
    keywords: normalizeKeywords(row.keywords),
    responseMessage:
      row.responseMessage ?? "Restaurant staff should assist with this request.",
    priority: row.priority,
  };
}

function normalizeKeywords(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((keyword): keyword is string => typeof keyword === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeKeywords(parsed);
    } catch {
      return [value];
    }
  }

  return [];
}
