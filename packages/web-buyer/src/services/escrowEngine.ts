import type { EscrowSavings, EscrowSmartContractData, VisualClause, EscrowDashboardSummary } from "../types/escrowEngine";
import { ESCROW_FEE_TIERS, STANDARD_FEE_RATE, ESCROW_CLAUSES, getFeeTier } from "../types/escrowEngine";
import { getTrustScore } from "./trustScore";
import { fetchEscrows } from "./escrow";

const FREE_ESCROW_KEY = "atb_free_escrow_used";
const SAVINGS_STORAGE_KEY = "atb_escrow_savings";

function getSavingsLocal(): number {
  try { return parseFloat(localStorage.getItem(SAVINGS_STORAGE_KEY) ?? "0"); } catch { return 0; }
}
function addSavingsLocal(amount: number): void {
  try { localStorage.setItem(SAVINGS_STORAGE_KEY, String(getSavingsLocal() + amount)); } catch { /* noop */ }
}

export function calculateEscrowFee(amount: number, trustScore: number): EscrowSavings {
  const tier = getFeeTier(trustScore);
  const standardFee = Math.round(amount * (STANDARD_FEE_RATE / 100));
  const actualFee = Math.round(amount * (tier.feeRate / 100));
  return {
    standardFee,
    actualFee,
    savings: standardFee - actualFee,
    feeRate: tier.feeRate,
    tierLabelKey: tier.labelKey,
    tierColor: tier.color,
    isFree: tier.feeRate === 0,
  };
}

export async function canUseFreeEscrow(userId: string): Promise<boolean> {
  try {
    const used = localStorage.getItem(`${FREE_ESCROW_KEY}_${userId}`);
    if (used === "true") return false;
    const ts = await getTrustScore(userId);
    if (!ts || ts.totalTrades > 0) {
      localStorage.setItem(`${FREE_ESCROW_KEY}_${userId}`, "true");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function markFreeEscrowUsed(userId: string): Promise<void> {
  try { localStorage.setItem(`${FREE_ESCROW_KEY}_${userId}`, "true"); } catch { /* noop */ }
}

export function generateVisualContract(
  orderId: string,
  buyerName: string,
  sellerName: string,
  amount: number,
  status: string,
  funded?: boolean,
  delivered?: boolean,
  confirmed?: boolean,
): EscrowSmartContractData {
  const statusLower = status.toLowerCase();
  const clauseStates: VisualClause[] = ESCROW_CLAUSES.map((c, i) => {
    let satisfied = false;
    if (i === 0) satisfied = statusLower === "funded" || statusLower === "delivered" || statusLower === "confirmed" || statusLower === "released" || funded === true;
    if (i === 1) satisfied = statusLower === "delivered" || statusLower === "confirmed" || statusLower === "released" || delivered === true;
    if (i === 2) satisfied = statusLower === "confirmed" || statusLower === "released" || confirmed === true;
    if (i === 3) satisfied = statusLower === "released";
    if (i === 4) satisfied = true;
    if (i === 5) satisfied = true;
    return { id: `clause-${i}`, ...c, satisfied };
  });

  return {
    orderId, buyerName, sellerName, amount,
    currency: "USDT", network: "TRC-20",
    createdAt: new Date().toISOString(),
    clauses: clauseStates,
    status,
  };
}

export async function getEscrowDashboardSummary(userId: string): Promise<EscrowDashboardSummary> {
  try {
    const escrows = await fetchEscrows();
    const userEscrows = escrows.filter((e) => e.buyerId === userId || e.producteurId === userId);
    const activeStatuses = ["pending", "funded", "delivered", "confirmed", "disputed"];
    const active = userEscrows.filter((e) => activeStatuses.includes(e.status));
    const pendingAction = userEscrows.filter((e) => e.status === "pending" || e.status === "delivered");

    const ts = await getTrustScore(userId);
    const score = ts?.score ?? 0;
    const tier = getFeeTier(score);

    const lifetimeSavings = getSavingsLocal();

    return {
      activeCount: active.length,
      pendingActionCount: pendingAction.length,
      totalLocked: active.reduce((s, e) => s + e.amount, 0),
      currency: "USDT",
      lifetimeSavings,
      nextFeeRate: tier.feeRate,
      nextFeeTier: tier.labelKey,
    };
  } catch {
    return {
      activeCount: 0, pendingActionCount: 0, totalLocked: 0,
      currency: "USDT", lifetimeSavings: 0, nextFeeRate: 2, nextFeeTier: "escrowEngine.fee.bronze",
    };
  }
}

export function recordEscrowSavings(amount: number): void {
  addSavingsLocal(amount);
}
