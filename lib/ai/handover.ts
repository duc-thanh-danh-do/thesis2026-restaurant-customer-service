import { shouldHandoverByDefault } from "@/services/handover.service";

export function shouldHandover(message: string) {
  return shouldHandoverByDefault(message);
}
