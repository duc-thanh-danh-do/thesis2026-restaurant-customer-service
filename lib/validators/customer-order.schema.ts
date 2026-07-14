import { z } from "zod";

const orderItemsSchema = z
  .record(z.string().regex(/^\d+$/), z.number().int().min(1).max(100))
  .refine((items) => Object.keys(items).length > 0, "Order items are required.")
  .refine((items) => Object.keys(items).length <= 50, "An order can contain at most 50 item types.");

export const createCustomerOrderSchema = z.object({
  qrToken: z.string().trim().min(1).max(255),
  sessionToken: z.string().trim().min(1).max(255).nullable().optional(),
  items: orderItemsSchema,
});

export const updateCustomerOrderSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm"),
    sessionToken: z.string().trim().min(1).max(255),
  }),
  z.object({
    action: z.literal("update_item_quantity"),
    itemId: z.number().int().positive(),
    quantity: z.number().int().min(0).max(100),
    sessionToken: z.string().trim().min(1).max(255),
  }),
]);
