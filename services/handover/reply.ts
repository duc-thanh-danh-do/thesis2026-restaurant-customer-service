import { shouldReplaceReplyForHandover } from "@/services/handover/text";
import type { HandoverDecision } from "@/services/handover/types";

export function buildHandoverReply(reply: string, decision: HandoverDecision) {
  return buildHandoverReplyText(reply, decision, true);
}

export function buildUnrecordedHandoverReply(
  reply: string,
  decision: HandoverDecision,
) {
  return buildHandoverReplyText(reply, decision, false);
}

function buildHandoverReplyText(
  reply: string,
  decision: HandoverDecision,
  notificationRecorded: boolean,
) {
  const normalizedReply = reply.trim();
  const guidance =
    decision.responseMessage ??
    "Restaurant staff should assist with this request.";
  const followUp = notificationRecorded
    ? "I have sent this to the restaurant staff so they can help."
    : "I could not notify staff through the application. Please contact restaurant staff directly.";

  if (!normalizedReply || shouldReplaceReplyForHandover(normalizedReply)) {
    return `${guidance} ${followUp}`;
  }

  return `${normalizedReply} ${followUp}`;
}
