import React, { createContext, useContext, useReducer, useCallback, ReactNode, useRef } from "react";
import { fetchPaymentMethods, initiatePayment, checkPaymentStatus, PaymentMethod, PaymentResult } from "../services/payment";
import { poll } from "../utils/polling";
import { savePaymentMethod } from "../utils/saved-payments";

export enum PaymentStep {
  SELECT_METHOD = "select_method",
  INPUT_DETAILS = "input_details",
  PROCESSING = "processing",
  MOMO_PUSH_SENT = "momo_push_sent",
  THREEDS_REDIRECT = "threeds_redirect",
  REDIRECT = "redirect",
  BANK_DETAILS = "bank_details",
  CRYPTO_ADDRESS = "crypto_address",
  VERIFYING = "verifying",
  SUCCESS = "success",
  FAILED = "failed",
  EXPIRED = "expired",
}

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  paidAt: string;
  invoiceUrl?: string;
}

export const MAX_RETRY_ATTEMPTS = 3;

export interface PaymentState {
  open: boolean;
  step: PaymentStep;
  amount: number;
  currency: string;
  orderId: string;
  buyerId?: string;
  lotId?: string;
  producteurId?: string;
  items?: PaymentItem[];
  methods: PaymentMethod[];
  selectedMethod: string | null;
  selectedProvider: string | null;
  userPhone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  senderName: string;
  cryptoWallet: string;
  paymentResult: PaymentResult | null;
  receipt: ReceiptData | null;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  loading: boolean;
  expiresAt: number | null;
  retryCount: number;
}

type PaymentAction =
  | { type: "OPEN_MODAL"; payload: { amount: number; orderId: string; buyerId?: string; lotId?: string; producteurId?: string; currency?: string; items?: PaymentItem[] } }
  | { type: "CLOSE_MODAL" }
  | { type: "LOAD_METHODS_SUCCESS"; payload: PaymentMethod[] }
  | { type: "SELECT_METHOD"; payload: { method: string; provider: string } }
  | { type: "SET_USER_INPUT"; payload: { phone?: string; cardNumber?: string; cardExpiry?: string; cardCvv?: string; senderName?: string; cryptoWallet?: string } }
  | { type: "SET_FIELD_ERRORS"; payload: Record<string, string> }
  | { type: "INITIATE_PENDING" }
  | { type: "MOMO_PUSH_SENT"; payload: PaymentResult }
  | { type: "INITIATE_THREEDS"; payload: PaymentResult }
  | { type: "INITIATE_REDIRECT"; payload: PaymentResult }
  | { type: "INITIATE_BANK"; payload: PaymentResult & { bankDetails: any } }
  | { type: "INITIATE_CRYPTO"; payload: PaymentResult }
  | { type: "SET_VERIFYING" }
  | { type: "INITIATE_SUCCESS"; payload: PaymentResult }
  | { type: "INITIATE_FAILED"; payload: string }
  | { type: "SET_EXPIRED" }
  | { type: "INCREMENT_RETRY" }
  | { type: "RESET" };

const initialState: PaymentState = {
  open: false,
  step: PaymentStep.SELECT_METHOD,
  amount: 0,
  currency: "XOF",
  orderId: "",
  methods: [],
  selectedMethod: null,
  selectedProvider: null,
  userPhone: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
  senderName: "",
  cryptoWallet: "",
  paymentResult: null,
  receipt: null,
  errorMessage: null,
  fieldErrors: {},
  loading: false,
  expiresAt: null,
  retryCount: 0,
};

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "OPEN_MODAL":
      return {
        ...initialState,
        open: true,
        amount: action.payload.amount,
        currency: action.payload.currency || "XOF",
        orderId: action.payload.orderId,
        buyerId: action.payload.buyerId,
        lotId: action.payload.lotId,
        producteurId: action.payload.producteurId,
        items: action.payload.items,
      };
    case "CLOSE_MODAL":
      return { ...state, open: false, paymentResult: null, errorMessage: null };
    case "LOAD_METHODS_SUCCESS":
      return { ...state, methods: action.payload };
    case "SELECT_METHOD":
      return { ...state, selectedMethod: action.payload.method, selectedProvider: action.payload.provider, step: PaymentStep.INPUT_DETAILS };
    case "SET_USER_INPUT":
      return {
        ...state,
        userPhone: action.payload.phone ?? state.userPhone,
        cardNumber: action.payload.cardNumber ?? state.cardNumber,
        cardExpiry: action.payload.cardExpiry ?? state.cardExpiry,
        cardCvv: action.payload.cardCvv ?? state.cardCvv,
        senderName: action.payload.senderName ?? state.senderName,
        cryptoWallet: action.payload.cryptoWallet ?? state.cryptoWallet,
        fieldErrors: {},
      };
    case "SET_FIELD_ERRORS":
      return { ...state, fieldErrors: action.payload };
    case "INITIATE_PENDING":
      return { ...state, step: PaymentStep.PROCESSING, loading: true, errorMessage: null };
    case "MOMO_PUSH_SENT":
      return { ...state, step: PaymentStep.MOMO_PUSH_SENT, paymentResult: action.payload, loading: false, expiresAt: Date.now() + 120_000 };
    case "INITIATE_THREEDS":
      return { ...state, step: PaymentStep.THREEDS_REDIRECT, paymentResult: action.payload, loading: false, expiresAt: Date.now() + 300_000 };
    case "INITIATE_REDIRECT":
      return { ...state, step: PaymentStep.REDIRECT, paymentResult: action.payload, loading: false, expiresAt: Date.now() + 300_000 };
    case "INITIATE_BANK":
      return { ...state, step: PaymentStep.BANK_DETAILS, paymentResult: action.payload, loading: false };
    case "INITIATE_CRYPTO":
      return { ...state, step: PaymentStep.CRYPTO_ADDRESS, paymentResult: action.payload, loading: false };
    case "SET_VERIFYING":
      return { ...state, step: PaymentStep.VERIFYING, loading: true };
    case "INITIATE_SUCCESS":
      return {
        ...state,
        step: PaymentStep.SUCCESS,
        paymentResult: action.payload,
        receipt: {
          transactionId: action.payload.id,
          orderId: state.orderId,
          amount: state.amount,
          currency: state.currency,
          method: state.selectedMethod || "",
          provider: state.selectedProvider || "",
          paidAt: new Date().toISOString(),
          invoiceUrl: action.payload.invoiceNumber ? `/invoices/${action.payload.invoiceNumber}` : undefined,
        },
        loading: false,
      };
    case "INITIATE_FAILED":
      return { ...state, step: PaymentStep.FAILED, errorMessage: action.payload, loading: false, retryCount: state.retryCount + 1 };
    case "SET_EXPIRED":
      return { ...state, step: PaymentStep.EXPIRED, loading: false, errorMessage: "Le délai de paiement a expiré" };
    case "INCREMENT_RETRY":
      return { ...state, retryCount: state.retryCount + 1 };
    case "RESET":
      return { ...state, step: PaymentStep.SELECT_METHOD, selectedMethod: null, selectedProvider: null, paymentResult: null, receipt: null, errorMessage: null, fieldErrors: {}, loading: false, expiresAt: null };
    default:
      return state;
  }
}

interface PaymentContextType {
  state: PaymentState;
  openPayment: (params: { amount: number; orderId: string; buyerId?: string; lotId?: string; producteurId?: string; currency?: string; items?: PaymentItem[] }) => void;
  closePayment: () => void;
  selectPaymentMethod: (method: string, provider: string) => void;
  setUserInput: (input: { phone?: string; cardNumber?: string; cardExpiry?: string; cardCvv?: string; senderName?: string; cryptoWallet?: string }) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  processPayment: () => Promise<void>;
  verifyPayment: () => void;
  expirePayment: () => void;
  resetPayment: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const pollingRef = useRef<boolean>(false);
  const pollAbortRef = useRef<boolean>(false);

  const openPayment = useCallback((params: { amount: number; orderId: string; buyerId?: string; lotId?: string; producteurId?: string; currency?: string; items?: PaymentItem[] }) => {
    dispatch({ type: "OPEN_MODAL", payload: params });
    fetchPaymentMethods().then(methods => dispatch({ type: "LOAD_METHODS_SUCCESS", payload: methods })).catch(() => {});
  }, []);

  const closePayment = useCallback(() => {
    pollAbortRef.current = true;
    pollingRef.current = false;
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const selectPaymentMethod = useCallback((method: string, provider: string) => {
    dispatch({ type: "SELECT_METHOD", payload: { method, provider } });
  }, []);

  const setUserInput = useCallback((input: { phone?: string; cardNumber?: string; cardExpiry?: string; cardCvv?: string; senderName?: string; cryptoWallet?: string }) => {
    dispatch({ type: "SET_USER_INPUT", payload: input });
  }, []);

  const setFieldErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: "SET_FIELD_ERRORS", payload: errors });
  }, []);

  const startPolling = useCallback(async (paymentId: string) => {
    if (pollingRef.current || pollAbortRef.current) return;
    pollingRef.current = true;
    pollAbortRef.current = false;

    try {
      const result = await poll(
        async () => {
          if (pollAbortRef.current) throw new Error("Polling aborted");
          return checkPaymentStatus(paymentId);
        },
        (res) => res.status === "completed" || res.status === "success" || res.status === "failed",
        { intervalMs: 2_000, maxRetries: 60, backoffFactor: 1.3, maxIntervalMs: 10_000 },
      );

      if (result.status === "completed" || result.status === "success") {
        savePaymentMethod(state.selectedMethod || "", state.selectedProvider || "", state.userPhone);
        dispatch({ type: "INITIATE_SUCCESS", payload: result });
      } else if (result.status === "failed") {
        dispatch({ type: "INITIATE_FAILED", payload: result.statusMessage || "Le paiement a échoué" });
      }
    } catch (err: any) {
      if (err.message === "Polling aborted") return;
      dispatch({ type: "INITIATE_FAILED", payload: err.message || "Échec de la vérification" });
    } finally {
      pollingRef.current = false;
    }
  }, []);

  const processPayment = useCallback(async () => {
    if (!state.selectedMethod || !state.selectedProvider) return;
    dispatch({ type: "INITIATE_PENDING" });

    try {
      const result = await initiatePayment({
        orderId: state.orderId,
        amount: state.amount,
        currency: state.currency,
        method: state.selectedMethod,
        provider: state.selectedProvider,
        buyerId: state.buyerId,
        phone: state.userPhone || undefined,
      });

      if (state.selectedMethod === "mobile_money") {
        dispatch({ type: "MOMO_PUSH_SENT", payload: result });
        startPolling(result.id);
      } else if (state.selectedMethod === "card" && result.paymentUrl) {
        dispatch({ type: "INITIATE_THREEDS", payload: result });
        startPolling(result.id);
      } else if (state.selectedMethod === "bank_transfer") {
        dispatch({ type: "INITIATE_BANK", payload: result as any });
      } else if (state.selectedMethod === "crypto") {
        dispatch({ type: "INITIATE_CRYPTO", payload: result });
      } else if (result.status === "completed" || result.status === "success") {
        dispatch({ type: "INITIATE_SUCCESS", payload: result });
      } else if (result.paymentUrl) {
        dispatch({ type: "INITIATE_REDIRECT", payload: result });
        startPolling(result.id);
        setTimeout(() => { window.open(result.paymentUrl, "_blank"); }, 2000);
      } else {
        dispatch({ type: "INITIATE_SUCCESS", payload: result });
      }
    } catch (err: any) {
      dispatch({ type: "INITIATE_FAILED", payload: err.message || "Payment failed" });
    }
  }, [state.selectedMethod, state.selectedProvider, state.orderId, state.amount, state.currency, state.buyerId, state.userPhone, startPolling]);

  const verifyPayment = useCallback(async () => {
    if (!state.paymentResult?.id) return;
    dispatch({ type: "SET_VERIFYING" });
    startPolling(state.paymentResult.id);
  }, [state.paymentResult, startPolling]);

  const expirePayment = useCallback(() => {
    pollAbortRef.current = true;
    pollingRef.current = false;
    dispatch({ type: "SET_EXPIRED" });
  }, []);

  const resetPayment = useCallback(() => {
    pollAbortRef.current = true;
    pollingRef.current = false;
    dispatch({ type: "RESET" });
  }, []);

  return (
    <PaymentContext.Provider value={{ state, openPayment, closePayment, selectPaymentMethod, setUserInput, setFieldErrors, processPayment, verifyPayment, expirePayment, resetPayment }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment(): PaymentContextType {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayment must be used within PaymentProvider");
  return ctx;
}
