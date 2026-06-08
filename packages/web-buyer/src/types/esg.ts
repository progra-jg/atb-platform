export type ESGScoreTier = "aaa" | "aa" | "a" | "bbb" | "bb" | "b" | "ccc";

export interface ESGScore {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  tier: ESGScoreTier;
  factors: ESGFactor[];
  lastUpdated: string;
  trend: "up" | "down" | "stable";
}

export interface ESGFactor {
  id: string;
  category: "environmental" | "social" | "governance";
  labelKey: string;
  weight: number;
  score: number;
  maxScore: number;
  unlocked: boolean;
  sourceKey: string;
}

export interface ESGRecommendation {
  id: string;
  factorKey: string;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
  actionKey: string;
  link?: string;
}

export interface ESGImpactBadge {
  badgeKey: string;
  icon: string;
  unlocked: boolean;
  impact: number;
}

export const ESG_TIERS: { min: number; tier: ESGScoreTier; labelKey: string; color: string }[] = [
  { min: 90, tier: "aaa", labelKey: "esg.tier.aaa", color: "#1a7d36" },
  { min: 75, tier: "aa", labelKey: "esg.tier.aa", color: "#2e9b4e" },
  { min: 60, tier: "a", labelKey: "esg.tier.a", color: "#4caf50" },
  { min: 45, tier: "bbb", labelKey: "esg.tier.bbb", color: "#8bc34a" },
  { min: 30, tier: "bb", labelKey: "esg.tier.bb", color: "#ffc107" },
  { min: 15, tier: "b", labelKey: "esg.tier.b", color: "#ff9800" },
  { min: 0, tier: "ccc", labelKey: "esg.tier.ccc", color: "#f44336" },
];
