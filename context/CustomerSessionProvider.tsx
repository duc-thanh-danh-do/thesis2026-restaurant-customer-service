"use client";

import { createContext, useContext } from "react";

const CustomerSessionContext = createContext<string | null>(null);

export function CustomerSessionProvider({
  children,
  sessionToken,
}: {
  children: React.ReactNode;
  sessionToken: string | null;
}) {
  return (
    <CustomerSessionContext.Provider value={sessionToken}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSessionContext() {
  return useContext(CustomerSessionContext);
}
