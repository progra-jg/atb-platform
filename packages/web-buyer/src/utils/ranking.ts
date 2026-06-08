import type { Lot } from "../types";
import { computeLotCompleteness } from "./scoring";

export const RANKING_WEIGHTS = {
  relevance: 0.4,
  trust: 0.3,
  quality: 0.2,
  rotation: 0.1,
} as const;

export interface RankingContext {
  preferredCrop?: string;
  preferredRegion?: string;
  prefersCertified: boolean;
  trustScores?: Record<string, number>;
}

export interface LotScores {
  relevance: number;
  trust: number;
  quality: number;
  rotation: number;
}

export interface RankedLot extends Lot {
  _rankWeight: number;
  _scores: LotScores;
}

function computeRelevance(lot: Lot, ctx: RankingContext): number {
  const noteFactor = (lot.note ?? 50) / 100;
  const cropMatch = ctx.preferredCrop && lot.culture === ctx.preferredCrop ? 1 : 0;
  const regionMatch = ctx.preferredRegion && lot.region === ctx.preferredRegion ? 1 : 0;
  const certMatch = ctx.prefersCertified && lot.certification ? 1 : 0;

  return Math.min(1,
    noteFactor * 0.4 +
    cropMatch * 0.3 +
    regionMatch * 0.2 +
    certMatch * 0.1
  );
}

function computeDataQuality(lot: Lot): number {
  const base = computeLotCompleteness(lot);
  const baseScore = base.score / 100;

  let bonus = 0;
  if (lot.images && lot.images.length > 0) bonus += 0.2;
  if (lot.labResults && lot.labResults.length > 0) bonus += 0.15;
  if (lot.stockQuality) bonus += 0.15;
  if (lot.harvest) bonus += 0.1;

  return Math.min(1, baseScore * 0.4 + bonus);
}

function computeRotation(lot: Lot, producerLotCounts: Map<string, number>, trustScore: number): number {
  const count = producerLotCounts.get(lot.producteur) ?? 1;
  const maxCount = Math.max(...producerLotCounts.values(), 1);
  const exposureRatio = count / maxCount;
  return (1 - exposureRatio) * (trustScore / 100);
}

export function rankLots(
  lots: Lot[],
  context: RankingContext
): RankedLot[] {
  const producerLotCounts = new Map<string, number>();
  for (const lot of lots) {
    producerLotCounts.set(lot.producteur, (producerLotCounts.get(lot.producteur) ?? 0) + 1);
  }

  const ranked = lots.map((lot) => {
    const trustScore = context.trustScores?.[lot.id] ?? lot.note ?? 50;

    const relevance = computeRelevance(lot, context);
    const trust = trustScore / 100;
    const quality = computeDataQuality(lot);
    const rotation = computeRotation(lot, producerLotCounts, trustScore);

    const total = (
      relevance * RANKING_WEIGHTS.relevance +
      trust * RANKING_WEIGHTS.trust +
      quality * RANKING_WEIGHTS.quality +
      rotation * RANKING_WEIGHTS.rotation
    );

    return {
      ...lot,
      _rankWeight: Math.round(total * 10000) / 10000,
      _scores: {
        relevance: Math.round(relevance * 100),
        trust: Math.round(trust * 100),
        quality: Math.round(quality * 100),
        rotation: Math.round(rotation * 100),
      },
    };
  });

  ranked.sort((a, b) => {
    const diff = b._rankWeight - a._rankWeight;
    if (Math.abs(diff) < 0.0001) {
      return b._scores.trust - a._scores.trust;
    }
    return diff;
  });

  return ranked;
}

export function rankLotsWithReason(
  lots: Lot[],
  context: RankingContext
): Array<RankedLot & { _dominantReason: string }> {
  const ranked = rankLots(lots, context);
  return ranked.map((lot) => {
    const maxScore = Math.max(lot._scores.relevance, lot._scores.trust, lot._scores.quality, lot._scores.rotation);
    let _dominantReason: string;
    if (lot._scores.relevance === maxScore) _dominantReason = "ranking.relevance";
    else if (lot._scores.trust === maxScore) _dominantReason = "ranking.trust";
    else if (lot._scores.quality === maxScore) _dominantReason = "ranking.quality";
    else _dominantReason = "ranking.rotation";
    return { ...lot, _dominantReason };
  });
}

export function recordClick(_lotId: string, _positive: boolean): void {}

export function resetBandit(): void {}
