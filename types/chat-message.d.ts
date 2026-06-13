export type UiChatMessage = {
  id: string;
  sender: "customer" | "ai" | "staff" | "system";
  content: string;
};
