import { createContext, useContext, useState, useEffect } from "react";
import { usePerformanceMonitor } from "../hooks/usePerformanceMonitor";

interface PerformanceContextValue {
  /** Mode critique : animations 0ms, pas d'ombres, pas de pré-chargement audio */
  isPerformanceMode: boolean;
}

export const PerformanceContext = createContext<PerformanceContextValue>({
  isPerformanceMode: false,
});

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const { isPerformanceMode } = usePerformanceMonitor();

  return (
    <PerformanceContext.Provider value={{ isPerformanceMode }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  return useContext(PerformanceContext);
}
