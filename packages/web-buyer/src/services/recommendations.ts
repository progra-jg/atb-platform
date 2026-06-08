import { fetchLots } from "./lots";
import { getFollowing } from "./follow";
import { getFavorites } from "./favorites";
import { fetchOrders } from "./orders";
import { fetchMarketPrices } from "./market";
import type { Lot } from "../types";
import type { BuyerPreferences, LotMatch, MatchReason, RecommendationFeed } from "../types/recommendation";

const CACHE = new Map<string, { feed: RecommendationFeed; ts: number }>();
const CACHE_TTL = 120_000;

function cacheGet(key: string): RecommendationFeed | null {
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.feed;
  CACHE.delete(key);
  return null;
}
function cacheSet(key: string, feed: RecommendationFeed): void {
  CACHE.set(key, { feed, ts: Date.now() });
  if (CACHE.size > 50) {
    const first = CACHE.keys().next().value;
    if (first) CACHE.delete(first);
  }
}

function norm(v: string): string {
  return v.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PRODUCT_MAP: Record<string, string[]> = {
  cacao: ["cacao"], coton: ["coton"], anacarde: ["anacarde", "cajou"],
  cafe: ["café", "cafe"], mais: ["maïs", "mais"], soja: ["soja"],
  manioc: ["manioc"], riz: ["riz"], sesame: ["sésame", "sesame"],
  fruits: ["fruits", "fruit"], legumes: ["légumes", "legumes"],
  huile_palme: ["huile de palme", "palme", "palmier"],
};

function matchesProduct(pref: string, lotCulture: string): boolean {
  const map = PRODUCT_MAP[norm(pref)];
  if (map) return map.some((p) => norm(lotCulture).includes(p));
  return norm(lotCulture).includes(norm(pref));
}

interface PriceStats {
  avg: number;
  min: number;
  max: number;
}

function computePriceStats(lots: Lot[]): Map<string, PriceStats> {
  const grouped = new Map<string, number[]>();
  for (const lot of lots) {
    if (!lot.prix || !lot.culture) continue;
    const key = norm(lot.culture);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(lot.prix);
  }
  const result = new Map<string, PriceStats>();
  for (const [key, prices] of grouped) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    result.set(key, { avg, min: Math.min(...prices), max: Math.max(...prices) });
  }
  return result;
}

export async function buildBuyerProfile(userId: string): Promise<BuyerPreferences> {
  const [following, orders] = await Promise.all([
    getFollowing(userId).catch(() => []),
    fetchOrders().catch(() => []),
  ]);
  const favorites = getFavorites();
  return {
    products: [],
    regions: [],
    volume: "",
    followedFarmers: following.map((f) => f.farmerId),
    favoriteLots: favorites.map((f) => f).filter(Boolean),
    orderedCrops: (Array.isArray(orders) ? orders : []).map((o: any) => (o.culture ?? "").toLowerCase()).filter(Boolean),
    orderedFarmers: (Array.isArray(orders) ? orders : []).map((o: any) => o.producteurId).filter(Boolean),
  };
}

export async function getPersonalizedFeed(
  userId: string,
  preferences: BuyerPreferences & { products?: string[]; regions?: string[]; volume?: string },
  esgScore?: { environmental: number; social: number; governance: number },
): Promise<RecommendationFeed> {
  const cacheKey = `${userId}-${preferences.products?.join(",")}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const allLots = await fetchLots().catch(() => []);
  if (!Array.isArray(allLots) || allLots.length === 0) {
    const empty: RecommendationFeed = { lots: [], totalScore: 0, generatedAt: new Date().toISOString(), buyerProductCount: 0, buyerRegionCount: 0 };
    return empty;
  }

  const prices = computePriceStats(allLots as Lot[]);
  const products = (preferences.products ?? []).map(norm).filter(Boolean);
  const regions = (preferences.regions ?? []).map(norm).filter(Boolean);
  const followedSet = new Set(preferences.followedFarmers);
  const favoriteSet = new Set(preferences.favoriteLots);
  const orderedCropsSet = new Set(preferences.orderedCrops);
  const orderedFarmersSet = new Set(preferences.orderedFarmers);

  const scored: LotMatch[] = [];

  for (const raw of allLots as Lot[]) {
    const reasons: MatchReason[] = [];
    let score = 0;
    let esgImpact = 0;

    const culture = norm(raw.culture);

    // Product match (up to 30 pts)
    if (products.length > 0) {
      const match = products.some((p) => matchesProduct(p, culture));
      if (match) {
        score += 30;
        reasons.push({ category: "perfect_match", labelKey: "recommendations.reason.productMatch", weight: 30 });
      }
    }

    // Ordered similar crop before (up to 15 pts)
    if (orderedCropsSet.has(culture)) {
      score += 15;
      reasons.push({ category: "perfect_match", labelKey: "recommendations.reason.previousOrder", weight: 15 });
    }

    // Region match (up to 20 pts)
    if (regions.length > 0) {
      const regionMatch = regions.some((r) => norm(raw.region ?? "").includes(r));
      if (regionMatch) {
        score += 20;
        reasons.push({ category: "regional", labelKey: "recommendations.reason.regionMatch", weight: 20 });
      }
    }

    // Followed producer (up to 25 pts)
    if (raw.producteurId && followedSet.has(raw.producteurId)) {
      score += 25;
      reasons.push({ category: "from_followed", labelKey: "recommendations.reason.followedProducer", weight: 25 });
    }

    // Previously ordered from this farmer (up to 20 pts)
    if (raw.producteurId && orderedFarmersSet.has(raw.producteurId)) {
      score += 20;
      reasons.push({ category: "from_followed", labelKey: "recommendations.reason.pastSupplier", weight: 20 });
    }

    // Certification (up to 15 pts)
    if (raw.certification && raw.certification !== "") {
      score += 15;
      reasons.push({ category: "certified", labelKey: "recommendations.reason.certified", weight: 15 });
      if (esgScore && esgScore.environmental < 60) {
        esgImpact += 8;
        reasons.push({ category: "esg_booster", labelKey: "recommendations.reason.esgBooster", weight: 10 });
      }
    }

    // Price value (up to 20 pts)
    if (raw.prix && raw.culture) {
      const stats = prices.get(culture);
      if (stats) {
        const belowAvg = stats.avg - raw.prix;
        if (belowAvg > stats.avg * 0.1) {
          score += 20;
          reasons.push({ category: "best_value", labelKey: "recommendations.reason.bestValue", weight: 20 });
        } else if (belowAvg > 0) {
          score += 10;
          reasons.push({ category: "best_value", labelKey: "recommendations.reason.goodPrice", weight: 10 });
        }
      }
    }

    // Quality score (up to 10 pts)
    if (raw.note && raw.note >= 90) {
      score += 10;
      reasons.push({ category: "certified", labelKey: "recommendations.reason.highQuality", weight: 10 });
    } else if (raw.note && raw.note >= 80) {
      score += 5;
    }

    if (reasons.length === 0) continue;

    const clampedScore = Math.min(score, 100);
    const priceVsMarket: "below" | "at" | "above" = (() => {
      const stats = prices.get(culture);
      if (!stats || !raw.prix) return "at";
      if (raw.prix < stats.avg * 0.95) return "below";
      if (raw.prix > stats.avg * 1.05) return "above";
      return "at";
    })();

    scored.push({
      lot: raw,
      score: clampedScore,
      reasons: reasons.sort((a, b) => b.weight - a.weight),
      esgImpact,
      priceVsMarket,
      isFollowedProducer: raw.producteurId ? followedSet.has(raw.producteurId) : false,
      isFavorited: favoriteSet.has(raw.id),
    });
  }

  scored.sort((a, b) => b.score - a.score || b.esgImpact - a.esgImpact);
  const top = scored.slice(0, 12);

  const totalScore = top.length > 0 ? Math.round(top.reduce((s, m) => s + m.score, 0) / top.length) : 0;

  const feed: RecommendationFeed = {
    lots: top,
    totalScore,
    generatedAt: new Date().toISOString(),
    buyerProductCount: products.length,
    buyerRegionCount: regions.length,
  };

  cacheSet(cacheKey, feed);
  return feed;
}

export async function getSmartPicks(userId: string, preferences: BuyerPreferences & { products?: string[]; regions?: string[] }): Promise<LotMatch[]> {
  const feed = await getPersonalizedFeed(userId, preferences);
  return feed.lots.filter((l) => l.score >= 50).slice(0, 4);
}

export async function getESGBoosters(userId: string, preferences: BuyerPreferences & { products?: string[]; regions?: string[] }): Promise<LotMatch[]> {
  const feed = await getPersonalizedFeed(userId, preferences, { environmental: 0, social: 50, governance: 50 });
  return feed.lots.filter((l) => l.esgImpact > 0).slice(0, 4);
}
