import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { validateNumber, generateNonce } from "../utils/security";
import type { VerificationPoint } from "../types";

export interface CartItem {
  lotId: string;
  culture: string;
  origine: string;
  quantite: string;
  quantiteChoisie: number;
  prix: number;
  producteurId: string;
  certification: string;
}

export type TransportOption = "hub" | "door";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (lotId: string) => void;
  updateQuantity: (lotId: string, delta: number) => void;
  clearCart: () => void;
  count: number;
  total: number;
  selectedPoint: VerificationPoint | null;
  setSelectedPoint: (point: VerificationPoint | null) => void;
  transportOption: TransportOption;
  setTransportOption: (opt: TransportOption) => void;
  inspectionFee: number;
  escrowTotal: number;
  nonce: string;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  count: 0,
  total: 0,
  selectedPoint: null,
  setSelectedPoint: () => {},
  transportOption: "hub",
  setTransportOption: () => {},
  inspectionFee: 0,
  escrowTotal: 0,
  nonce: "",
});

const STORAGE_KEY = "atb_cart";
const POINT_KEY = "atb_verification_point";
const TRANSPORT_KEY = "atb_transport_option";

function sanitizeItem(i: any): CartItem {
  return {
    lotId: String(i.lotId ?? ""),
    culture: String(i.culture ?? "").slice(0, 100),
    origine: String(i.origine ?? "").slice(0, 100),
    quantite: String(i.quantite ?? "").slice(0, 50),
    prix: validateNumber(i.prix, 0),
    producteurId: String(i.producteurId ?? "").slice(0, 100),
    certification: String(i.certification ?? "").slice(0, 100),
    quantiteChoisie: Math.max(1, validateNumber(i.quantiteChoisie, 1)),
  };
}

function loadPointsFromStorage(): VerificationPoint | null {
  try {
    const raw = localStorage.getItem(POINT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored.map(sanitizeItem) : [];
    } catch { return []; }
  });

  const [selectedPoint, setSelectedPointState] = useState<VerificationPoint | null>(() => loadPointsFromStorage());
  const [transportOption, setTransportOptionState] = useState<TransportOption>(() => {
    try { return (localStorage.getItem(TRANSPORT_KEY) as TransportOption) || "hub"; }
    catch { return "hub"; }
  });
  const [nonce, setNonce] = useState(() => generateNonce());

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(POINT_KEY, JSON.stringify(selectedPoint)); }, [selectedPoint]);
  useEffect(() => { localStorage.setItem(TRANSPORT_KEY, transportOption); }, [transportOption]);

  const setSelectedPoint = useCallback((point: VerificationPoint | null) => {
    setSelectedPointState(point);
    setNonce(generateNonce());
  }, []);

  const setTransportOption = useCallback((opt: TransportOption) => {
    setTransportOptionState(opt);
    setNonce(generateNonce());
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.lotId === item.lotId);
      if (existing) {
        return prev.map((i) =>
          i.lotId === item.lotId
            ? { ...i, quantiteChoisie: Math.max(1, validateNumber(i.quantiteChoisie, 0) + 1) }
            : i
        );
      }
      return [...prev, { ...sanitizeItem(item), quantiteChoisie: Math.max(1, validateNumber(item.quantiteChoisie, 1)) }];
    });
    setNonce(generateNonce());
  }, []);

  const removeItem = useCallback((lotId: string) => {
    setItems((prev) => prev.filter((i) => i.lotId !== lotId));
    setNonce(generateNonce());
  }, []);

  const updateQuantity = useCallback((lotId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.lotId !== lotId) return i;
        const cur = Math.max(1, validateNumber(i.quantiteChoisie, 1));
        const next = cur + delta;
        return next < 1 ? { ...i, quantiteChoisie: cur } : { ...i, quantiteChoisie: next };
      })
    );
    setNonce(generateNonce());
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectedPoint(null);
    setNonce(generateNonce());
  }, [setSelectedPoint]);

  const count = items.reduce((s, i) => s + Math.max(0, validateNumber(i.quantiteChoisie, 0)), 0);
  const total = items.reduce((s, i) => s + validateNumber(i.prix, 0) * Math.max(0, validateNumber(i.quantiteChoisie, 0)), 0);
  const inspectionFee = selectedPoint ? selectedPoint.inspectionFeeFcfa : 0;
  const escrowTotal = total + inspectionFee;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart, count, total,
      selectedPoint, setSelectedPoint, transportOption, setTransportOption,
      inspectionFee, escrowTotal, nonce,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
