import type { Lot } from ".";

export type MatchCategory = "perfect_match" | "esg_booster" | "best_value" | "from_followed" | "new_arrival" | "certified" | "volume_match" | "regional";

export interface MatchReason {
  category: MatchCategory;
  labelKey: string;
  weight: number;
}

export interface LotMatch {
  lot: Lot;
  score: number;
  reasons: MatchReason[];
  esgImpact: number;
  priceVsMarket: "below" | "at" | "above";
  isFollowedProducer: boolean;
  isFavorited: boolean;
}

export interface BuyerPreferences {
  products: string[];
  regions: string[];
  volume: string;
  followedFarmers: string[];
  favoriteLots: string[];
  orderedCrops: string[];
  orderedFarmers: string[];
}

export interface RecommendationFeed {
  lots: LotMatch[];
  totalScore: number;
  generatedAt: string;
  buyerProductCount: number;
  buyerRegionCount: number;
}
