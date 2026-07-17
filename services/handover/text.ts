export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, " ").trim();
}

export function isLowConfidenceReply(reply: string | null | undefined) {
  if (!reply) return false;

  return /\b(not available|do not have enough information|don't have enough information|could not answer|could not find)\b/i.test(
    reply,
  );
}

export function shouldReplaceReplyForHandover(reply: string) {
  return (
    isLowConfidenceReply(reply) ||
    /\bAI assistant is not configured|could not reach Gemini\b/i.test(reply)
  );
}
