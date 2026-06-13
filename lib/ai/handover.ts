export function shouldHandover(message: string) {
  return /\b(allerg|bill|pay|staff|complaint)\b/i.test(message);
}
