import type { Lot } from "../types";
import { computeLotCompleteness } from "./scoring";

export interface ThresholdResult {
  meetsThreshold: boolean;
  score: number;
  requiredScore: number;
  isLargeLot: boolean;
  missingRequirements: string[];
  severity: "ok" | "warning" | "blocking";
  estimatedLotValue: number;
}

function isLargeLot(lot: Lot): { isLarge: boolean; estimatedValue: number } {
  const qtyStr = (lot.quantite ?? "").replace(/\s/g, "").replace(/kg/gi, "");
  const qty = parseInt(qtyStr, 10) || 0;
  const estimatedValue = lot.prix * Math.max(qty, 100);
  return { isLarge: qty >= 5000 || estimatedValue >= 5_000_000, estimatedValue };
}

function computeStockQualityScore(lot: Lot): number {
  if (!lot.stockQuality) return 0;
  let filled = 0;
  const total = 7;
  const sq = lot.stockQuality;
  if (sq.moisture) filled++;
  if (sq.impurities) filled++;
  if (sq.defects) filled++;
  if (sq.netWeight) filled++;
  if (sq.packaging) filled++;
  if (sq.storageLocation) filled++;
  if (sq.storageConditions) filled++;
  return filled / total;
}

export function computeThreshold(lot: Lot, trustScore?: number): ThresholdResult {
  const { isLarge, estimatedValue } = isLargeLot(lot);
  const requiredScore = isLarge ? 70 : 40;

  const completeness = computeLotCompleteness(lot);
  const completenessScore = completeness.score / 100;

  const stockQualityScore = computeStockQualityScore(lot);

  const hasLabResults = (lot.labResults?.length ?? 0) > 0;
  const hasHarvest = !!lot.harvest;
  const hasImages = (lot.images?.length ?? 0) > 0;

  const score =
    completenessScore * 30 +
    (trustScore != null ? (trustScore / 100) * 25 : 0) +
    stockQualityScore * 20 +
    (hasLabResults ? 15 : 0) +
    (hasHarvest ? 10 : 0) +
    (hasImages ? 0 : 0);

  const clampedScore = Math.round(Math.max(0, Math.min(100, score)));

  const missingRequirements: string[] = [];
  if (completenessScore < 0.7) missingRequirements.length; // handled by completeness separately

  return {
    meetsThreshold: clampedScore >= requiredScore,
    score: clampedScore,
    requiredScore,
    isLargeLot: isLarge,
    missingRequirements,
    severity: isLarge && clampedScore < requiredScore ? "blocking" : clampedScore < requiredScore ? "warning" : "ok",
    estimatedLotValue: estimatedValue,
  };
}

export function computeLotValue(lot: Lot): number {
  const qtyStr = (lot.quantite ?? "").replace(/\s/g, "").replace(/kg/gi, "");
  const qty = parseInt(qtyStr, 10) || 0;
  return lot.prix * Math.max(qty, 100);
}
