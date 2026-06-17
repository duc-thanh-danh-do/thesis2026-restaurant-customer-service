"use client";

import { createContext, useContext } from "react";

const RestaurantContext = createContext(1);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  return <RestaurantContext.Provider value={1}>{children}</RestaurantContext.Provider>;
}

export function useRestaurantId() {
  return useContext(RestaurantContext);
}
