import { shouldReplaceReplyForHandover } from "@/services/handover/text";
import type { HandoverDecision } from "@/services/handover/types";

export function buildHandoverReply(reply: string, decision: HandoverDecision) {
  const normalizedReply = reply.trim();
  const guidance =
    decision.responseMessage ??
    "Restaurant staff should assist with this request.";
  const confirmation = "I have sent this to the restaurant staff so they can help.";

  if (!normalizedReply || shouldReplaceReplyForHandover(normalizedReply)) {
    return `${guidance} ${confirmation}`;
  }

  return `${normalizedReply} ${confirmation}`;
}
