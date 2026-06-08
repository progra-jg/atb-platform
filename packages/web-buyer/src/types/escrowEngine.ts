import type { ScoreTier } from "./trustScore";

export interface EscrowFeeTier {
  minScore: number;
  maxScore: number;
  feeRate: number;
  tier: ScoreTier;
  labelKey: string;
  color: string;
}

export interface EscrowSavings {
  standardFee: number;
  actualFee: number;
  savings: number;
  feeRate: number;
  tierLabelKey: string;
  tierColor: string;
  isFree: boolean;
}

export interface VisualClause {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  satisfied: boolean;
}

export interface EscrowSmartContractData {
  orderId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  currency: string;
  network: string;
  createdAt: string;
  clauses: VisualClause[];
  status: string;
}

export interface EscrowDashboardSummary {
  activeCount: number;
  pendingActionCount: number;
  totalLocked: number;
  currency: string;
  lifetimeSavings: number;
  nextFeeRate: number;
  nextFeeTier: string;
}

export const ESCROW_FEE_TIERS: EscrowFeeTier[] = [
  { minScore: 0,   maxScore: 299,  feeRate: 2.0,  tier: "bronze",  labelKey: "escrowEngine.fee.bronze",  color: "#cd7f32" },
  { minScore: 300, maxScore: 499,  feeRate: 1.5,  tier: "silver",  labelKey: "escrowEngine.fee.silver",  color: "#9ca3af" },
  { minScore: 500, maxScore: 699,  feeRate: 1.0,  tier: "gold",    labelKey: "escrowEngine.fee.gold",    color: "#fbbf24" },
  { minScore: 700, maxScore: 849,  feeRate: 0.5,  tier: "platinum",labelKey: "escrowEngine.fee.platinum",color: "#94a3b8" },
  { minScore: 850, maxScore: 1000, feeRate: 0.0,  tier: "diamond", labelKey: "escrowEngine.fee.diamond", color: "#06b6d4" },
];

export const STANDARD_FEE_RATE = 2.0;

export const ESCROW_CLAUSES = [
  { icon: "🔒", titleKey: "escrowEngine.clause.deposit.title", descKey: "escrowEngine.clause.deposit.desc" },
  { icon: "📦", titleKey: "escrowEngine.clause.delivery.title", descKey: "escrowEngine.clause.delivery.desc" },
  { icon: "✅", titleKey: "escrowEngine.clause.confirmation.title", descKey: "escrowEngine.clause.confirmation.desc" },
  { icon: "💸", titleKey: "escrowEngine.clause.release.title", descKey: "escrowEngine.clause.release.desc" },
  { icon: "⚖️", titleKey: "escrowEngine.clause.dispute.title", descKey: "escrowEngine.clause.dispute.desc" },
  { icon: "🔗", titleKey: "escrowEngine.clause.blockchain.title", descKey: "escrowEngine.clause.blockchain.desc" },
];

export function getFeeTier(score: number): EscrowFeeTier {
  for (const tier of ESCROW_FEE_TIERS) {
    if (score >= tier.minScore && score <= tier.maxScore) return tier;
  }
  return ESCROW_FEE_TIERS[0];
}
