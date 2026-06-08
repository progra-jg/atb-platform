import type { Lot, Order, FarmerProfile, Review } from "../types";

export interface TrustScoreResult {
  overall: number;
  components: {
    transactionSuccessRate: number;
    credibilityScore: number;
    trustIndexScore: number;
    dataCompleteness: number;
    didVerified: number;
    eudrCompliance: number;
  };
  tier: "platinum" | "gold" | "silver" | "bronze";
  labelKey: string;
}

export interface LotCompletenessResult {
  score: number;
  total: number;
  filled: number;
  missing: string[];
}

const LOT_FIELDS: { key: keyof Lot; label: string }[] = [
  { key: "culture", label: "Culture" },
  { key: "origine", label: "Origine" },
  { key: "region", label: "Région" },
  { key: "quantite", label: "Quantité" },
  { key: "certification", label: "Certification" },
  { key: "prix", label: "Prix" },
  { key: "producteur", label: "Producteur" },
  { key: "phone", label: "Téléphone" },
];

function computeTransactionSuccessRate(orders: Order[]): number {
  if (orders.length === 0) return 0.75;
  const delivered = orders.filter((o) => o.statut === "Livrée").length;
  const inProgress = orders.filter(
    (o) => o.statut === "Confirmée" || o.statut === "En livraison" || o.statut === "Prêt au hub" || o.statut === "Dépôt reçu"
  ).length;
  const total = orders.length;
  const raw = (delivered * 1.0 + inProgress * 0.5) / total;
  return Math.max(0, Math.min(1, raw));
}

function computeDataCompleteness(lots: Lot[]): number {
  if (lots.length === 0) return 0.5;
  const totalFields = lots.length * LOT_FIELDS.length;
  const filledFields = lots.reduce((sum, lot) => {
    return sum + LOT_FIELDS.filter((f) => {
      const v = lot[f.key];
      return v !== undefined && v !== null && v !== "" && v !== 0;
    }).length;
  }, 0);
  return filledFields / totalFields;
}

export function computeTrustScore(
  farmer: FarmerProfile,
  orders: Order[],
  lots: Lot[],
  reviews: Review[]
): TrustScoreResult {
  const transactionSuccessRate = computeTransactionSuccessRate(orders);
  const credibilityScore = (farmer.credibilityScore ?? 75) / 100;
  const trustIndexScore = (farmer.trustIndex ?? 75) / 100;
  const completeness = computeDataCompleteness(lots);
  const didVerified = farmer.didVerified ? 1 : 0;
  const eudrCompliance = farmer.eudr?.compliant ? 1 : 0;

  const overall = Math.round(
    transactionSuccessRate * 30 +
    credibilityScore * 25 +
    trustIndexScore * 20 +
    completeness * 10 +
    didVerified * 10 +
    eudrCompliance * 5
  );

  const clamped = Math.max(0, Math.min(100, overall));

  let tier: TrustScoreResult["tier"];
  let labelKey: string;
  if (clamped >= 90) {
    tier = "platinum";
    labelKey = "trustBadge.tier.platinum";
  } else if (clamped >= 75) {
    tier = "gold";
    labelKey = "trustBadge.tier.gold";
  } else if (clamped >= 55) {
    tier = "silver";
    labelKey = "trustBadge.tier.silver";
  } else {
    tier = "bronze";
    labelKey = "trustBadge.tier.bronze";
  }

  return {
    overall: clamped,
    components: {
      transactionSuccessRate: Math.round(transactionSuccessRate * 100),
      credibilityScore: Math.round(credibilityScore * 100),
      trustIndexScore: Math.round(trustIndexScore * 100),
      dataCompleteness: Math.round(completeness * 100),
      didVerified: Math.round(didVerified * 100),
      eudrCompliance: Math.round(eudrCompliance * 100),
    },
    tier,
    labelKey,
  };
}

export function computeLotCompleteness(lot: Lot): LotCompletenessResult {
  const missing: string[] = [];
  const filled = LOT_FIELDS.filter((f) => {
    const v = lot[f.key];
    const present = v !== undefined && v !== null && v !== "" && v !== 0;
    if (!present) missing.push(f.label);
    return present;
  }).length;
  return {
    score: Math.round((filled / LOT_FIELDS.length) * 100),
    total: LOT_FIELDS.length,
    filled,
    missing,
  };
}

export function computeRankingWeight(
  trustScore: number,
  completenessScore: number,
  lot: Lot
): number {
  const priceFactor = lot.prix > 0 ? 1 - Math.min(1, (lot.prix - 100) / 10000) : 0.5;
  const noteFactor = (lot.note ?? 50) / 100;
  const availabilityFactor = lot.statut === "Disponible" ? 1 : lot.statut === "En transit" ? 0.5 : 0.1;
  return (
    trustScore / 100 * 0.3 +
    completenessScore / 100 * 0.1 +
    noteFactor * 0.25 +
    priceFactor * 0.2 +
    availabilityFactor * 0.15
  );
}
