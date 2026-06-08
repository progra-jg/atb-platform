import api from "./api";

export interface PaymentTransaction {
  id: string;
  orderId: string;
  contractId?: string;
  buyerId: string;
  producteurId?: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  providerRef?: string;
  status: string;
  statusMessage?: string;
  paidAt?: string;
  invoiceNumber?: string;
  verifiedByAdmin: boolean;
  notes?: string;
  createdAt: string;
  buyerName?: string;
  producteurName?: string;
}

export interface PaymentStats {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  todayVolume: number;
  todayCount: number;
  byMethod: { method: string; count: number; volume: number }[];
  pendingVerification: number;
}

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 300));

const STATUS_CHIPS: Record<string, { label: string; color: "warning" | "info" | "success" | "error" | "default" }> = {
  pending: { label: "En attente", color: "warning" },
  processing: { label: "En cours", color: "info" },
  completed: { label: "Payé", color: "success" },
  failed: { label: "Échoué", color: "error" },
  refunded: { label: "Remboursé", color: "default" },
};

const METHODS: Record<string, string> = { mobile_money: "Mobile Money", card: "Carte bancaire", bank_transfer: "Virement", crypto: "Cryptomonnaie" };

function genPayments(): PaymentTransaction[] {
  return Array.from({ length: 25 }, (_, i) => ({
    id: `pay_${i + 1}`,
    orderId: `CMD-${String(2024).slice(-2)}-${String(i + 1).padStart(3, "0")}`,
    buyerId: `buyer_${(i % 5) + 1}`,
    producteurId: `prod_${(i % 8) + 1}`,
    amount: Math.round((500 + Math.random() * 500000) / 100) * 100,
    currency: "XOF",
    method: ["mobile_money", "mobile_money", "card", "bank_transfer", "crypto"][i % 5],
    provider: ["mtn_momo", "moov_flooz", "fedapay", "bank_xof", "usdt_trc20"][i % 5],
    providerRef: i % 3 === 0 ? `TXN${Date.now().toString(36).toUpperCase()}` : undefined,
    status: ["completed", "completed", "completed", "pending", "failed"][i % 5],
    paidAt: i % 5 !== 3 && i % 5 !== 4 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
    invoiceNumber: i % 2 === 0 ? `INV-${2024}-${String(i + 1).padStart(4, "0")}` : undefined,
    verifiedByAdmin: Math.random() > 0.5,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    buyerName: `Acheteur ${(i % 5) + 1}`,
    producteurName: `Producteur ${(i % 8) + 1}`,
  }));
}

const MOCK_TRANSACTIONS = genPayments();
const MOCK_STATS: PaymentStats = {
  totalVolume: MOCK_TRANSACTIONS.reduce((a, t) => a + t.amount, 0),
  totalTransactions: MOCK_TRANSACTIONS.length,
  successRate: Math.round((MOCK_TRANSACTIONS.filter(t => t.status === "completed").length / MOCK_TRANSACTIONS.length) * 100),
  todayVolume: MOCK_TRANSACTIONS.slice(0, 3).reduce((a, t) => a + t.amount, 0),
  todayCount: 3,
  byMethod: [
    { method: "mobile_money", count: 10, volume: 1500000 },
    { method: "card", count: 6, volume: 2500000 },
    { method: "bank_transfer", count: 5, volume: 5000000 },
    { method: "crypto", count: 4, volume: 8000000 },
  ],
  pendingVerification: MOCK_TRANSACTIONS.filter(t => t.status === "pending" && !t.verifiedByAdmin).length,
};

export async function fetchPayments(filters?: { status?: string; method?: string }): Promise<PaymentTransaction[]> {
  try { const { data } = await api.get("/payments", { params: filters }); return data; }
  catch { await delay(); return MOCK_TRANSACTIONS; }
}

export async function fetchPaymentStats(): Promise<PaymentStats> {
  try { const { data } = await api.get("/payment/stats"); return data; }
  catch { await delay(); return MOCK_STATS; }
}

export async function verifyPayment(paymentId: string): Promise<void> {
  try { await api.post(`/payment/${paymentId}/verify`); } catch { await delay(500); }
}

export async function retryPayment(params: { orderId: string; amount: number; method: string; provider: string; currency?: string }): Promise<void> {
  try { await api.post("/payment/initiate", params); } catch { await delay(1500); }
}

export { STATUS_CHIPS, METHODS };


