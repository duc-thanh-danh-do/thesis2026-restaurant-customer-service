import { z } from "zod";

export const createCustomerSessionSchema = z.object({
  qrCodeToken: z.string().min(1),
});

export const updateCustomerSessionSchema = z.object({
  status: z.enum(["active", "waiting_staff", "closed"]).optional(),
});
