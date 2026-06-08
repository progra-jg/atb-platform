import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CompareContextType {
  compareList: any[];
  addToCompare: (lot: any) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  isInCompare: () => false,
  clearCompare: () => {},
});

const STORAGE_KEY = "atb_compare";

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((lot: any) => {
    setCompareList((prev) => {
      if (prev.length >= 4) return prev;
      if (prev.some((l) => l.id === lot.id)) return prev;
      return [...prev, lot];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const isInCompare = useCallback((id: string) => {
    return compareList.some((l) => l.id === id);
  }, [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
