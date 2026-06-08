export type ScoreTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface TradeEvaluation {
  id: string;
  tradeId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface TrustBreakdown {
  baseScore: number;
  tradesBonus: number;
  ratingsBonus: number;
  profileBonus: number;
  verificationBonus: number;
  tenureBonus: number;
  penalties: number;
  total: number;
}

export interface UnlockableFeature {
  key: string;
  minScore: number;
  icon: string;
  labelKey: string;
  descKey: string;
}

export interface TrustScore {
  userId: string;
  score: number;
  tier: ScoreTier;
  breakdown: TrustBreakdown;
  totalTrades: number;
  positiveRatings: number;
  negativeRatings: number;
  totalEvaluations: number;
  recentEvaluations: TradeEvaluation[];
  unlockedFeatures: string[];
  nextTier: ScoreTier | null;
  scoreToNextTier: number;
  updatedAt: string;
}

export const TRUST_STORAGE_KEY = "atb_trust_v1";
export const EVALUATION_STORAGE_KEY = "atb_evaluations_v1";

export const SCORE_TIERS: Record<ScoreTier, { min: number; max: number; labelKey: string; color: string }> = {
  bronze:  { min: 0,   max: 299,  labelKey: "trustScore.tier.bronze",  color: "#cd7f32" },
  silver:  { min: 300, max: 499,  labelKey: "trustScore.tier.silver",  color: "#9ca3af" },
  gold:    { min: 500, max: 699,  labelKey: "trustScore.tier.gold",    color: "#fbbf24" },
  platinum:{ min: 700, max: 849,  labelKey: "trustScore.tier.platinum",color: "#94a3b8" },
  diamond: { min: 850, max: 1000, labelKey: "trustScore.tier.diamond", color: "#06b6d4" },
};

export const UNLOCKABLE_FEATURES: UnlockableFeature[] = [
  { key: "escrow_reduction",  minScore: 300, icon: "🔒", labelKey: "trustScore.feature.escrowReduction.label",  descKey: "trustScore.feature.escrowReduction.desc" },
  { key: "accelerated_payment", minScore: 500, icon: "⚡", labelKey: "trustScore.feature.acceleratedPayment.label", descKey: "trustScore.feature.acceleratedPayment.desc" },
  { key: "financing",         minScore: 700, icon: "💰", labelKey: "trustScore.feature.financing.label",       descKey: "trustScore.feature.financing.desc" },
  { key: "vip",               minScore: 850, icon: "👑", labelKey: "trustScore.feature.vip.label",            descKey: "trustScore.feature.vip.desc" },
];

export function getTier(score: number): ScoreTier {
  for (const [tier, { min, max }] of Object.entries(SCORE_TIERS)) {
    if (score >= min && score <= max) return tier as ScoreTier;
  }
  return "bronze";
}

export function getScoreToNextTier(score: number): { nextTier: ScoreTier | null; scoreToNext: number } {
  const entries = Object.entries(SCORE_TIERS) as [ScoreTier, { min: number; max: number }][];
  for (let i = 0; i < entries.length; i++) {
    const [tier, { min, max }] = entries[i];
    if (score >= min && score <= max) {
      if (tier === "diamond") return { nextTier: null, scoreToNext: 0 };
      const nextTier = entries[i + 1]?.[0] ?? null;
      const scoreToNext = nextTier ? entries[i + 1][1].min - score : 0;
      return { nextTier, scoreToNext };
    }
  }
  return { nextTier: "silver", scoreToNext: 300 - score };
}
