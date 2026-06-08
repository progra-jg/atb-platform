import { PaymentMethod, PaymentResult } from "../types/payment";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function apiCall<T>(path: string, options?: RequestInit, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 5000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

const MOCK_METHODS: PaymentMethod[] = [
  { id: "mobile_money", label: "Mobile Money", icon: "Smartphone", providers: [{ id: "mtn_momo", name: "MTN MoMo" }, { id: "moov_flooz", name: "Moov Flooz" }, { id: "orange_money", name: "Orange Money" }], minAmount: 100, maxAmount: 5000000, processingTime: "instant", fee: "0.8%" },
  { id: "card", label: "Carte bancaire", icon: "CreditCard", providers: [{ id: "fedapay", name: "FedaPay" }, { id: "cinetpay", name: "CinetPay" }], minAmount: 500, maxAmount: 10000000, processingTime: "instant", fee: "1.5%" },
  { id: "bank_transfer", label: "Virement bancaire", icon: "Bank", providers: [{ id: "bank_xof", name: "Banque locale (XOF)" }], minAmount: 100000, maxAmount: 50000000, processingTime: "24-48h", fee: "0%" },
  { id: "crypto", label: "Cryptomonnaie", icon: "CurrencyCircleDollar", providers: [{ id: "usdt_trc20", name: "USDT (TRC-20)" }, { id: "usdc_polygon", name: "USDC (Polygon)" }], minAmount: 50000, maxAmount: 100000000, processingTime: "5-15 min", fee: "0.5%" },
];

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try { const res = await apiCall<{ success: boolean; data: PaymentMethod[] }>("/payment/methods"); return res.data; }
  catch { return MOCK_METHODS; }
}

export async function checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
  try {
    const res = await apiCall<{ success: boolean; data: PaymentResult }>(`/payment/${paymentId}/check-status`, {
      method: "POST",
    });
    return res.data;
  } catch {
    return { id: paymentId, status: "processing" };
  }
}

export async function initiatePayment(params: {
  orderId: string;
  amount: number;
  method: string;
  provider: string;
  currency?: string;
  idempotencyKey?: string;
  buyerId?: string;
  phone?: string;
}): Promise<PaymentResult> {
  try {
    const res = await apiCall<{ success: boolean; data: PaymentResult }>("/payment/initiate", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return res.data;
  } catch {
    const isTransfer = params.method === "bank_transfer";
    const isCrypto = params.method === "crypto";
    const id = "pay_" + Math.random().toString(36).slice(2, 10);
    return {
      id,
      status: isTransfer ? "processing" : "completed",
      paymentUrl: isTransfer || isCrypto ? undefined : `https://pay.atb.bj/checkout/${id.slice(0, 8)}`,
      invoiceNumber: isTransfer ? `INV-${Date.now().toString(36).toUpperCase()}` : undefined,
      bankDetails: isTransfer ? {
        bankName: "Bank of Africa Bénin",
        accountName: "AgriTrace Bénin SARL",
        accountNumber: "BJ123 45678 90123456789 01",
        swift: "BOFABJBB",
        rib: "BJ06 12345 67890 1234567890 12",
      } : undefined,
      walletAddress: isCrypto ? "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("") : undefined,
      qrCode: isCrypto ? "data:image/png;base64,iVBOR..." : undefined,
    };
  }
}

export type { PaymentMethod, PaymentResult };
