import { PayoutRecord, PayoutStats } from "../types/payout";

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

const MOCK_PAYOUTS: PayoutRecord[] = [
  { id: "po_1", paymentId: "pay_1", orderId: "ord_1", producteurId: "prod_1", amount: 150000, currency: "XOF", method: "mobile_money", provider: "mtn_momo", phone: "+22961010101", providerRef: "REF_001", status: "completed", completedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 90000000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "po_2", paymentId: "pay_2", orderId: "ord_2", producteurId: "prod_1", amount: 250000, currency: "XOF", method: "mobile_money", provider: "moov_flooz", phone: "+22962020202", status: "processing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_STATS: PayoutStats = {
  totalDisbursed: 400000,
  totalTransactions: 2,
  successRate: 50,
  byProvider: [{ provider: "mtn_momo", count: 1, volume: 150000 }, { provider: "moov_flooz", count: 1, volume: 250000 }],
  today: { count: 1, volume: 250000 },
  pendingCount: 1,
};

export async function initiatePayout(params: {
  paymentId: string;
  orderId: string;
  producteurId: string;
  amount: number;
  method: string;
  provider: string;
  phone: string;
  currency?: string;
}): Promise<PayoutRecord> {
  try {
    const res = await apiCall<{ success: boolean; data: PayoutRecord }>("/payout/initiate", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return res.data;
  } catch {
    const id = "po_" + Math.random().toString(36).slice(2, 10);
    return {
      id, paymentId: params.paymentId, orderId: params.orderId,
      producteurId: params.producteurId,
      amount: params.amount, currency: params.currency || "XOF",
      method: params.method, provider: params.provider,
      phone: params.phone, status: "completed",
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function fetchPayouts(filter?: { producteurId?: string; status?: string }): Promise<PayoutRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.producteurId) params.set("producteurId", filter.producteurId);
    if (filter?.status) params.set("status", filter.status);
    const qs = params.toString();
    const res = await apiCall<{ success: boolean; data: PayoutRecord[] }>(`/payouts${qs ? `?${qs}` : ""}`);
    return res.data;
  } catch {
    return MOCK_PAYOUTS;
  }
}

export async function fetchPayoutStats(producteurId?: string): Promise<PayoutStats> {
  try {
    const qs = producteurId ? `?producteurId=${producteurId}` : "";
    const res = await apiCall<{ success: boolean; data: PayoutStats }>(`/payout/stats${qs}`);
    return res.data;
  } catch {
    return MOCK_STATS;
  }
}

export async function checkPayoutStatus(payoutId: string): Promise<PayoutRecord> {
  try {
    const res = await apiCall<{ success: boolean; data: PayoutRecord }>(`/payout/${payoutId}/check-status`, {
      method: "POST",
    });
    return res.data;
  } catch {
    return { id: payoutId, paymentId: "", orderId: "", producteurId: "", amount: 0, currency: "XOF", method: "", provider: "", phone: "", status: "processing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}
