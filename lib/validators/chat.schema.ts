import { z } from "zod";

export const chatMessageSchema = z.object({
  sessionToken: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
});
