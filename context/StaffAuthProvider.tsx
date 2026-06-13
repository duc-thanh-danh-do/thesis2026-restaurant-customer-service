"use client";

import { createContext, useContext } from "react";

const StaffAuthContext = createContext(false);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  return <StaffAuthContext.Provider value={false}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  return useContext(StaffAuthContext);
}
