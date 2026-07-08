import {
  createUnconfirmedOrder,
  createUnconfirmedOrderToolDescription,
  createUnconfirmedOrderToolName,
  createUnconfirmedOrderToolSchema,
  type CreateUnconfirmedOrderToolInput,
} from "@/lib/ai/tools/create-unconfirmed-order";

export {
  createUnconfirmedOrder,
  createUnconfirmedOrderToolDescription,
  createUnconfirmedOrderToolName,
  createUnconfirmedOrderToolSchema,
  type CreateUnconfirmedOrderToolInput,
};

export const aiTools = {
  createUnconfirmedOrder: {
    name: createUnconfirmedOrderToolName,
    description: createUnconfirmedOrderToolDescription,
    schema: createUnconfirmedOrderToolSchema,
    execute: createUnconfirmedOrder,
  },
} as const;
