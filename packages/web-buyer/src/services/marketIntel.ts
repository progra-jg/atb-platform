import { fetchMarketPrices } from "./market";
import type { MarketPrice } from "../types";
import type { PriceAnalysis, MarketBrief, BuySignal, PriceForecast } from "../types/marketIntel";

function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };
  const indices = Array.from({ length: n }, (_, i) => i);
  const sx = indices.reduce((a, b) => a + b, 0);
  const sy = values.reduce((a, b) => a + b, 0);
  const sxx = indices.reduce((a, b) => a + b * b, 0);
  const sxy = indices.reduce((a, _, i) => a + i * values[i], 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const ssTotal = values.reduce((a, v) => a + (v - sy / n) ** 2, 0);
  const ssRes = values.reduce((a, v, i) => a + (v - (slope * i + intercept)) ** 2, 0);
  const r2 = ssTotal > 0 ? 1 - ssRes / ssTotal : 0;
  return { slope, intercept, r2 };
}

function calcVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function calcMovingAverage(values: number[], period: number): number {
  if (values.length < period) return values.reduce((a, b) => a + b, 0) / values.length;
  return values.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function analyzePrice(marketPrice: MarketPrice): PriceAnalysis {
  const history = marketPrice.history ?? [];
  const currentPrice = marketPrice.price;
  const avg7 = calcMovingAverage(history, Math.min(7, history.length));
  const avg30 = calcMovingAverage(history, history.length);
  const vol = calcVolatility(history);
  const reg = linearRegression(history);
  const normSlope = avg30 > 0 ? reg.slope / avg30 : 0;

  let trend: PriceAnalysis["trend"];
  let trendStrength: number;
  if (normSlope > 0.05) { trend = "strong_up"; trendStrength = Math.min(Math.abs(normSlope) * 100, 100); }
  else if (normSlope > 0.015) { trend = "up"; trendStrength = Math.min(Math.abs(normSlope) * 100, 70); }
  else if (normSlope < -0.05) { trend = "strong_down"; trendStrength = Math.min(Math.abs(normSlope) * 100, 100); }
  else if (normSlope < -0.015) { trend = "down"; trendStrength = Math.min(Math.abs(normSlope) * 100, 70); }
  else { trend = "stable"; trendStrength = 0; }

  const forecast = reg.intercept + reg.slope * (history.length + 4);
  const forecastConfidence = reg.r2 > 0.7 ? "high" : reg.r2 > 0.4 ? "medium" : "low";

  let signal: PriceAnalysis["signal"];
  let signalStrength: number;
  const belowAvg7 = currentPrice < avg7;
  const belowAvg30 = currentPrice < avg30;
  const isUpTrend = trend === "up" || trend === "strong_up";
  const isLowVol = vol < 0.08;

  if (belowAvg30 && isUpTrend) { signal = "buy"; signalStrength = Math.min(100, Math.round((avg30 - currentPrice) / avg30 * 200 + (isLowVol ? 20 : 0) + (reg.r2 > 0.5 ? 15 : 0))); }
  else if (belowAvg7 && isUpTrend) { signal = "watch"; signalStrength = Math.min(80, Math.round((avg7 - currentPrice) / avg7 * 100 + 10)); }
  else if (!isUpTrend && currentPrice > avg30 * 1.05) { signal = "wait"; signalStrength = Math.min(80, Math.round((currentPrice - avg30) / avg30 * 100)); }
  else { signal = "watch"; signalStrength = 30; }

  return {
    crop: marketPrice.crop,
    currentPrice,
    change: marketPrice.change,
    avg7: Math.round(avg7),
    avg30: Math.round(avg30),
    volatility: Math.round(vol * 1000) / 10,
    trend,
    trendStrength,
    forecast: Math.round(forecast),
    forecastConfidence,
    signal,
    signalStrength,
    history,
  };
}

export async function generateMarketBrief(cropsOfInterest: string[]): Promise<MarketBrief> {
  const prices = await fetchMarketPrices().catch(() => [] as MarketPrice[]);
  let relevant = prices;
  if (cropsOfInterest.length > 0) {
    const cropSet = new Set(cropsOfInterest.map((c) => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    relevant = prices.filter((p) => cropSet.has(p.crop.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  }
  if (relevant.length === 0) relevant = prices.slice(0, 5);

  const analyses = relevant.map(analyzePrice);
  const buySignals = analyses.filter((a) => a.signal === "buy").sort((a, b) => b.signalStrength - a.signalStrength);
  const bullish = analyses.filter((a) => a.trend === "up" || a.trend === "strong_up").length;
  const bearish = analyses.filter((a) => a.trend === "down" || a.trend === "strong_down").length;

  return {
    generatedAt: new Date().toISOString(),
    analyses,
    topBuySignal: buySignals[0] ?? null,
    marketSentiment: bullish > bearish * 1.5 ? "bullish" : bearish > bullish * 1.5 ? "bearish" : "neutral",
    totalCropsTracked: prices.length,
  };
}

export function getBuySignals(analyses: PriceAnalysis[]): BuySignal[] {
  return analyses
    .filter((a) => a.signal === "buy" || a.signal === "watch")
    .sort((a, b) => b.signalStrength - a.signalStrength)
    .slice(0, 3)
    .map((a) => ({
      crop: a.crop,
      currentPrice: a.currentPrice,
      vsAvg7: Math.round(((a.currentPrice - a.avg7) / a.avg7) * 1000) / 10,
      vsAvg30: Math.round(((a.currentPrice - a.avg30) / a.avg30) * 1000) / 10,
      reasonKey: a.signal === "buy" ? "marketIntel.buyReason" : "marketIntel.watchReason",
      confidence: a.signalStrength,
    }));
}

export function getForecast(analysis: PriceAnalysis, daysAhead = 14): PriceForecast {
  const halfRange = analysis.currentPrice * analysis.volatility * 0.03 * daysAhead;
  return {
    crop: analysis.crop,
    currentPrice: analysis.currentPrice,
    predictedNext: analysis.forecast,
    predictedLow: Math.round(analysis.forecast - halfRange),
    predictedHigh: Math.round(analysis.forecast + halfRange),
    daysAhead,
  };
}
