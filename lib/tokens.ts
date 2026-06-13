import { randomUUID } from "node:crypto";

export function createToken(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}
