import api from "./api";

export interface EscrowContract {
  id: string;
  orderId: string;
  buyerId: string;
  producteurId: string;
  amount: number;
  currency: string;
  network: string;
  status: EscrowStatus;
  contractAddress?: string;
  depositTxHash?: string;
  releaseTxHash?: string;
  fundedAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  releasedAt?: string;
  terms?: any;
  disputed: boolean;
  disputeReason?: string;
  resolution?: string;
  createdAt: string;
  buyerName?: string;
  producteurName?: string;
}

export type EscrowStatus = "pending" | "funded" | "delivered" | "confirmed" | "released" | "disputed" | "resolved" | "refunded" | "cancelled";

export interface EscrowStats {
  totalVolume: number;
  activeCount: number;
  disputeRate: number;
  feesCollected: number;
  byStatus: { status: string; count: number; volume: number }[];
  disputeTrend: { month: string; count: number }[];
}

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 300));

function genEscrows(): EscrowContract[] {
  const statuses: EscrowStatus[] = ["pending", "funded", "delivered", "confirmed", "released", "disputed", "resolved", "refunded", "cancelled"];
  return Array.from({ length: 30 }, (_, i) => ({
    id: `esc_${i + 1}`,
    orderId: `CMD-${String(2024).slice(-2)}-${String(i + 1).padStart(3, "0")}`,
    buyerId: `buyer_${(i % 6) + 1}`,
    producteurId: `prod_${(i % 10) + 1}`,
    amount: Math.round((200000 + Math.random() * 8000000) / 100) * 100,
    currency: "USDT",
    network: "TRC-20",
    status: statuses[i % statuses.length],
    contractAddress: i > 1 ? `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` : undefined,
    depositTxHash: i > 1 ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` : undefined,
    fundedAt: i > 1 ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : undefined,
    deliveredAt: i > 3 ? new Date(Date.now() - (i - 3) * 86400000).toISOString() : undefined,
    confirmedAt: i > 4 ? new Date(Date.now() - (i - 4) * 86400000).toISOString() : undefined,
    releasedAt: i > 5 ? new Date(Date.now() - (i - 5) * 86400000).toISOString() : undefined,
    disputed: i % 9 === 5 || i % 9 === 6,
    disputeReason: i % 9 === 5 || i % 9 === 6 ? "Produit non conforme aux spécifications convenues" : undefined,
    resolution: i % 9 === 6 ? (["release_to_seller", "refund_buyer", "split"] as const)[i % 3] : undefined,
    createdAt: new Date(Date.now() - (i + 3) * 86400000).toISOString(),
    buyerName: `Acheteur ${(i % 6) + 1}`,
    producteurName: `Producteur ${(i % 10) + 1}`,
  }));
}

const MOCK_ESCROWS = genEscrows();
const MOCK_STATS: EscrowStats = {
  totalVolume: MOCK_ESCROWS.reduce((a, e) => a + e.amount, 0),
  activeCount: MOCK_ESCROWS.filter(e => ["funded", "delivered", "confirmed"].includes(e.status)).length,
  disputeRate: Math.round((MOCK_ESCROWS.filter(e => e.disputed).length / MOCK_ESCROWS.length) * 100),
  feesCollected: Math.round(MOCK_ESCROWS.reduce((a, e) => a + e.amount, 0) * 0.005),
  byStatus: Object.entries(
    MOCK_ESCROWS.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({ status, count, volume: MOCK_ESCROWS.filter(e => e.status === status).reduce((a, e) => a + e.amount, 0) })),
  disputeTrend: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"].map((month, i) => ({ month, count: Math.floor(Math.random() * 5) + i })),
};

export async function fetchEscrows(filters?: { status?: string; buyerId?: string; producteurId?: string }): Promise<EscrowContract[]> {
  try { const { data } = await api.get("/escrows", { params: filters }); return data; }
  catch { await delay(); return MOCK_ESCROWS; }
}

export async function fetchEscrowStats(): Promise<EscrowStats> {
  try { const { data } = await api.get("/escrow/stats"); return data; }
  catch { await delay(); return MOCK_STATS; }
}

export async function resolveDispute(escrowId: string, resolution: "release_to_seller" | "refund_buyer" | "split"): Promise<EscrowContract> {
  try {
    const { data } = await api.post(`/escrow/${escrowId}/resolve`, { resolution });
    return data;
  } catch {
    await delay(600);
    return { id: escrowId, status: "resolved", resolution } as any;
  }
}

export async function releaseFunds(escrowId: string): Promise<EscrowContract> {
  try { const { data } = await api.post(`/escrow/${escrowId}/release`); return data; }
  catch { await delay(400); return { id: escrowId, status: "released" } as any; }
}

export async function cancelEscrow(escrowId: string): Promise<EscrowContract> {
  try { const { data } = await api.post(`/escrow/${escrowId}/cancel`); return data; }
  catch { await delay(400); return { id: escrowId, status: "cancelled" } as any; }
}
