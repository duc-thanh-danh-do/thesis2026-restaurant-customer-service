import { z } from "zod";
import { createUnconfirmedOrder as createUnconfirmedCustomerOrder } from "@/services/customer-order.service";

export const createUnconfirmedOrderToolName = "createUnconfirmedOrder";

export const createUnconfirmedOrderToolDescription =
  "Create an unconfirmed customer order draft for the current table. The customer must review and confirm it before it is sent to restaurant staff.";

export const createUnconfirmedOrderToolSchema = z.object({
  qrToken: z.string().trim().min(1),
  sessionToken: z.string().trim().min(1).nullable().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
});

export type CreateUnconfirmedOrderToolInput = z.infer<
  typeof createUnconfirmedOrderToolSchema
>;

export async function createUnconfirmedOrder(input: unknown) {
  const parsedInput = createUnconfirmedOrderToolSchema.parse(input);
  const items = Object.fromEntries(
    parsedInput.items.map((item) => [String(item.menuItemId), item.quantity]),
  );

  const result = await createUnconfirmedCustomerOrder({
    qrToken: parsedInput.qrToken,
    sessionToken: parsedInput.sessionToken,
    items,
  });

  return {
    orderId: result.order.id,
    status: result.order.status,
    total: Number(result.order.total),
    sessionToken: result.sessionToken,
    items: result.order.orderItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    customerActionRequired: "confirm_order",
  };
}
