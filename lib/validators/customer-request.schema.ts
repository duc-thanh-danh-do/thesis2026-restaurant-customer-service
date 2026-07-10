import { z } from "zod";
import { REQUEST_TYPES } from "@/constants/requestTypes";

export const createCustomerRequestSchema = z.object({
  requestType: z.enum(REQUEST_TYPES).default("staff_help"),
  description: z.string().trim().max(1000).optional(),
});
