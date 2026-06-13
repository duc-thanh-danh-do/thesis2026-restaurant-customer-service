import { z } from "zod";

export const menuItemFilterSchema = z.object({
  category: z.string().optional(),
  isAvailable: z.enum(["true", "false"]).optional(),
  isVegetarian: z.enum(["true", "false"]).optional(),
});
