import { z } from "zod";

export const chatMessageSchema = z.object({
  qrToken: z.string().trim().min(1).optional(),
  sessionToken: z.string().trim().min(1).optional().nullable(),
  legacySessionTokenOnly: z.boolean().optional(),
  message: z.string().trim().min(1).max(2000),
});
