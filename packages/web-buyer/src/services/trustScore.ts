import api from "./api";
import type {
  TrustScore, TradeEvaluation, TrustBreakdown, ScoreTier,
} from "../types/trustScore";
import {
  TRUST_STORAGE_KEY, EVALUATION_STORAGE_KEY,
  getTier, getScoreToNextTier, UNLOCKABLE_FEATURES,
} from "../types/trustScore";

const STORE = new Map<string, TrustScore>();
const EVALS_STORE = new Map<string, TradeEvaluation[]>();

let evalCounter = 0;
const nextEvalId = () => `TEVAL-${String(++evalCounter).padStart(6, "0")}`;

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

function calculateScore(breakdown: TrustBreakdown): number {
  return Math.max(0, Math.min(1000,
    breakdown.baseScore +
    breakdown.tradesBonus +
    breakdown.ratingsBonus +
    breakdown.profileBonus +
    breakdown.verificationBonus +
    breakdown.tenureBonus -
    breakdown.penalties
  ));
}

function buildBreakdown(trades: number, positive: number, negative: number): TrustBreakdown {
  const baseScore = 300;
  const tradesBonus = Math.min(trades * 15, 200);
  const ratingsBonus = Math.min(positive * 8, 150);
  const penalties = negative * 25;
  const profileBonus = 40;
  const verificationBonus = 50;
  const tenureBonus = Math.min(60, 60);
  return { baseScore, tradesBonus, ratingsBonus, profileBonus, verificationBonus, tenureBonus, penalties, total: 0 };
}

function buildTrustScore(userId: string, trades: number, positive: number, negative: number, evals: TradeEvaluation[]): TrustScore {
  const breakdown = buildBreakdown(trades, positive, negative);
  const score = calculateScore(breakdown);
  breakdown.total = score;
  const tier = getTier(score);
  const { nextTier, scoreToNext } = getScoreToNextTier(score);
  const unlockedFeatures = UNLOCKABLE_FEATURES
    .filter((f) => score >= f.minScore)
    .map((f) => f.key);

  return {
    userId, score, tier, breakdown,
    totalTrades: trades,
    positiveRatings: positive,
    negativeRatings: negative,
    totalEvaluations: evals.length,
    recentEvaluations: evals.slice(-10).reverse(),
    unlockedFeatures,
    nextTier,
    scoreToNextTier: scoreToNext,
    updatedAt: new Date().toISOString(),
  };
}

export async function getTrustScore(userId: string): Promise<TrustScore | null> {
  try {
    const { data } = await api.get(`/trust-score/${userId}`);
    return data;
  } catch {
    await delay(200);
    let cached = STORE.get(userId);
    if (cached) return cached;

    const evals = getLocal<TradeEvaluation>(`${EVALUATION_STORAGE_KEY}_${userId}`);
    const allEvals = getLocal<TradeEvaluation>(EVALUATION_STORAGE_KEY)
      .filter((e) => e.toUserId === userId || e.fromUserId === userId);

    const receivedEvals = allEvals.filter((e) => e.toUserId === userId);
    const buyOrders = await (async () => {
      try {
        const m = await import("./orders");
        const o = await m.fetchOrders();
        return Array.isArray(o) ? o : [];
      } catch { return []; }
    })();
    const trades = buyOrders.length;
    const positive = receivedEvals.filter((e) => e.rating >= 4).length;
    const negative = receivedEvals.filter((e) => e.rating <= 2).length;

    const ts = buildTrustScore(userId, trades, positive, negative, receivedEvals);
    STORE.set(userId, ts);
    return ts;
  }
}

export async function submitEvaluation(
  fromUserId: string,
  toUserId: string,
  tradeId: string,
  rating: number,
  comment: string,
): Promise<TradeEvaluation> {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  try {
    const { data } = await api.post("/trust-score/evaluate", {
      fromUserId, toUserId, tradeId, rating, comment,
    });
    return data;
  } catch {
    await delay(300);
    const evalItem: TradeEvaluation = {
      id: nextEvalId(),
      tradeId,
      fromUserId,
      toUserId,
      rating: Math.round(rating),
      comment,
      createdAt: new Date().toISOString(),
    };

    const all = getLocal<TradeEvaluation>(EVALUATION_STORAGE_KEY);
    all.push(evalItem);
    setLocal(EVALUATION_STORAGE_KEY, all);

    const userEvals = getLocal<TradeEvaluation>(`${EVALUATION_STORAGE_KEY}_${toUserId}`);
    userEvals.push(evalItem);
    setLocal(`${EVALUATION_STORAGE_KEY}_${toUserId}`, userEvals);

    STORE.delete(fromUserId);
    STORE.delete(toUserId);

    return evalItem;
  }
}

export async function getPendingEvaluations(userId: string): Promise<{ tradeId: string; tradeRef: string; counterpartyName: string }[]> {
  try {
    const { data } = await api.get(`/trust-score/pending/${userId}`);
    return data;
  } catch {
    await delay(200);
    const ordersModule = await import("./orders");
    const orders = await ordersModule.fetchOrders();
    const completed = (Array.isArray(orders) ? orders : []).filter(
      (o: { statut: string }) => o.statut === "Livrée" || o.statut === "Terminée",
    );
    const allEvals = getLocal<TradeEvaluation>(EVALUATION_STORAGE_KEY);
    const evaledTradeIds = new Set(
      allEvals.filter((e) => e.fromUserId === userId).map((e) => e.tradeId),
    );
    return completed
      .filter((o: { id: string }) => !evaledTradeIds.has(o.id))
      .map((o: { id: string; lot: string }) => ({
        tradeId: o.id,
        tradeRef: o.id,
        counterpartyName: o.lot || "Producteur",
      }));
  }
}

export async function recalculateTrustScore(userId: string): Promise<TrustScore> {
  STORE.delete(userId);
  const ts = await getTrustScore(userId);
  return ts!;
}
