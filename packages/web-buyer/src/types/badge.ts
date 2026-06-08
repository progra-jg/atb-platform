export type BadgeId =
  | "firstPurchase"
  | "verifiedBuyer"
  | "volume10t"
  | "fiveOrders"
  | "eudrCompliant"
  | "ambassador"
  | "greenPurchase";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDefinition {
  id: BadgeId;
  tier: BadgeTier;
  icon: string;
  labelKey: string;
  descKey: string;
  progressKey: string;
  maxProgress: number;
}

export interface BadgeProgress {
  badgeId: BadgeId;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface BadgeState {
  badges: BadgeProgress[];
  totalUnlocked: number;
  totalBadges: number;
  nextMilestone: BadgeId | null;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: "firstPurchase", tier: "bronze", icon: "🛒", labelKey: "badges.firstPurchase.name", descKey: "badges.firstPurchase.desc", progressKey: "badges.firstPurchase.progress", maxProgress: 1 },
  { id: "verifiedBuyer", tier: "bronze", icon: "✅", labelKey: "badges.verifiedBuyer.name", descKey: "badges.verifiedBuyer.desc", progressKey: "badges.verifiedBuyer.progress", maxProgress: 1 },
  { id: "volume10t", tier: "silver", icon: "📦", labelKey: "badges.volume10t.name", descKey: "badges.volume10t.desc", progressKey: "badges.volume10t.progress", maxProgress: 10 },
  { id: "fiveOrders", tier: "silver", icon: "📋", labelKey: "badges.fiveOrders.name", descKey: "badges.fiveOrders.desc", progressKey: "badges.fiveOrders.progress", maxProgress: 5 },
  { id: "eudrCompliant", tier: "gold", icon: "🌍", labelKey: "badges.eudrCompliant.name", descKey: "badges.eudrCompliant.desc", progressKey: "badges.eudrCompliant.progress", maxProgress: 1 },
  { id: "ambassador", tier: "gold", icon: "🤝", labelKey: "badges.ambassador.name", descKey: "badges.ambassador.desc", progressKey: "badges.ambassador.progress", maxProgress: 3 },
  { id: "greenPurchase", tier: "platinum", icon: "🌱", labelKey: "badges.greenPurchase.name", descKey: "badges.greenPurchase.desc", progressKey: "badges.greenPurchase.progress", maxProgress: 1 },
];
