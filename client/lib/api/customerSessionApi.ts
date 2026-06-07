import type { CustomerSessionResponse } from "../../types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function createCustomerSession(
  qrCodeToken: string,
): Promise<CustomerSessionResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const response = await fetch(`${API_BASE_URL}/customer-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ qrCodeToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to create customer session");
  }

  return response.json();
}