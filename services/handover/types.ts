export const LOW_CONFIDENCE_KEYWORD = "__low_confidence__";
export const OPEN_REQUEST_STATUSES = ["pending", "Waiting", "waiting", "open"];

export type HandoverDecision = {
  required: boolean;
  ruleId: number | null;
  ruleName: string | null;
  category: string | null;
  requestType: string | null;
  reason: string | null;
  responseMessage: string | null;
};

export type HandoverRule = {
  id: number | null;
  name: string;
  category: string;
  requestType: string;
  keywords: string[];
  responseMessage: string;
  priority: number;
};

export type HandoverRuleRow = {
  id: number;
  name: string;
  category: string;
  requestType: string;
  keywords: unknown;
  responseMessage: string | null;
  priority: number;
};
