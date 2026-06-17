"use client";

import { createContext, useContext } from "react";

const ThemeContext = createContext("light");

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value="light">{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
