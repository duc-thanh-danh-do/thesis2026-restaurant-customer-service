import { useMemo } from "react";

export function useCustomerSession(sessionToken: string | null) {
  return useMemo(() => ({ sessionToken, isActive: Boolean(sessionToken) }), [sessionToken]);
}
