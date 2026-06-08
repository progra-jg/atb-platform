export interface PriceAnalysis {
  crop: string;
  currentPrice: number;
  change: number;
  avg7: number;
  avg30: number;
  volatility: number;
  trend: "strong_up" | "up" | "stable" | "down" | "strong_down";
  trendStrength: number;
  forecast: number;
  forecastConfidence: "high" | "medium" | "low";
  signal: "buy" | "watch" | "wait";
  signalStrength: number;
  history: number[];
}

export interface MarketBrief {
  generatedAt: string;
  analyses: PriceAnalysis[];
  topBuySignal: PriceAnalysis | null;
  marketSentiment: "bullish" | "neutral" | "bearish";
  totalCropsTracked: number;
}

export interface BuySignal {
  crop: string;
  currentPrice: number;
  vsAvg7: number;
  vsAvg30: number;
  reasonKey: string;
  confidence: number;
}

export interface PriceForecast {
  crop: string;
  currentPrice: number;
  predictedNext: number;
  predictedLow: number;
  predictedHigh: number;
  daysAhead: number;
}
