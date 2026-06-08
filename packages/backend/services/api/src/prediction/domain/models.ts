import { ModelType, PredictionPoint, BacktestResult, AccuracyMetrics } from "./types";

export class LinearRegressionModel {
  private slope = 0;
  private intercept = 0;
  private r2 = 0;
  private lastX = 0;

  train(prices: { date: number; price: number }[]): { slope: number; intercept: number; r2: number } {
    const n = prices.length;
    if (n < 2) {
      this.slope = 0;
      this.intercept = prices.length === 1 ? prices[0].price : 0;
      this.r2 = 1;
      this.lastX = prices.length === 1 ? prices[0].date : 0;
      return { slope: this.slope, intercept: this.intercept, r2: this.r2 };
    }

    const xs = prices.map(p => p.date);
    const ys = prices.map(p => p.price);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);
    const meanY = sumY / n;
    const meanX = sumX / n;

    const denom = n * sumX2 - sumX * sumX;
    this.slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    this.intercept = (sumY - this.slope * sumX) / n;

    const ssRes = ys.reduce((s, y, i) => s + (y - (this.slope * xs[i] + this.intercept)) ** 2, 0);
    const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
    this.r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

    this.lastX = xs[n - 1];
    return { slope: this.slope, intercept: this.intercept, r2: this.r2 };
  }

  predict(daysAhead: number): number {
    if (daysAhead < 1) daysAhead = 1;
    return this.slope * (this.lastX + daysAhead) + this.intercept;
  }
}

export class SimpleMovingAverageModel {
  constructor(private window: number = 7) {}

  predict(prices: number[], steps?: number): number[] {
    if (prices.length === 0) return [];
    if (steps == null) steps = this.window;

    const result: number[] = [];
    const effectiveWindow = Math.min(this.window, prices.length);

    let sum = 0;
    for (let i = prices.length - effectiveWindow; i < prices.length; i++) {
      sum += prices[i];
    }
    const sma = sum / effectiveWindow;
    const lastPrice = prices[prices.length - 1];

    for (let i = 0; i < steps; i++) {
      result.push(sma);
    }
    return result;
  }
}

export class SimpleExponentialSmoothingModel {
  private alpha = 0.3;
  private optimized = false;

  private optimizeAlpha(prices: number[]): number {
    if (prices.length < 3) return 0.3;

    let bestAlpha = 0.3;
    let bestMse = Infinity;

    for (let a = 0.01; a <= 0.99; a += 0.02) {
      const smoothed: number[] = [prices[0]];
      for (let i = 1; i < prices.length; i++) {
        smoothed.push(a * prices[i] + (1 - a) * smoothed[i - 1]);
      }

      const mse = prices.reduce((s, p, i) => s + (p - smoothed[i]) ** 2, 0) / prices.length;
      if (mse < bestMse) {
        bestMse = mse;
        bestAlpha = Math.round(a * 100) / 100;
      }
    }

    return bestAlpha;
  }

  predict(prices: number[], steps: number): number[] {
    if (prices.length === 0) return [];
    if (!this.optimized) {
      this.alpha = this.optimizeAlpha(prices);
      this.optimized = true;
    }

    const smoothed: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      smoothed.push(this.alpha * prices[i] + (1 - this.alpha) * smoothed[i - 1]);
    }

    const lastSmoothed = smoothed[smoothed.length - 1];
    const result: number[] = [];
    for (let i = 0; i < steps; i++) {
      result.push(lastSmoothed);
    }
    return result;
  }
}

export class EnsembleModel {
  private linearModel = new LinearRegressionModel();
  private smaModel = new SimpleMovingAverageModel(7);
  private sesModel = new SimpleExponentialSmoothingModel();

  predict(
    prices: number[],
    steps: number,
  ): { mean: number; lower: number; upper: number }[] {
    if (prices.length < 2) {
      return Array.from({ length: steps }, (_, i) => ({
        mean: prices[0] || 0,
        lower: prices[0] || 0,
        upper: prices[0] || 0,
      }));
    }

    const dated = prices.map((price, i) => ({ date: i, price }));
    this.linearModel.train(dated);
    const linearPreds = Array.from({ length: steps }, (_, i) => this.linearModel.predict(i + 1));
    const smaPreds = this.smaModel.predict(prices, steps);
    const sesPreds = this.sesModel.predict(prices, steps);

    const validModels = [linearPreds, smaPreds, sesPreds].filter(m => m.length >= steps);
    if (validModels.length === 0) {
      return Array.from({ length: steps }, () => ({ mean: prices[prices.length - 1], lower: prices[prices.length - 1], upper: prices[prices.length - 1] }));
    }

    const result: { mean: number; lower: number; upper: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const preds = validModels.map(m => m[i]);
      const mean = preds.reduce((s, v) => s + v, 0) / preds.length;
      const variance = preds.reduce((s, v) => s + (v - mean) ** 2, 0) / preds.length;
      const stddev = Math.sqrt(variance);
      const margin = 1.96 * stddev;
      result.push({
        mean: Math.round(mean * 100) / 100,
        lower: Math.round((mean - margin) * 100) / 100,
        upper: Math.round((mean + margin) * 100) / 100,
      });
    }

    return result;
  }
}

export class PricePredictor {
  private ensemble = new EnsembleModel();
  private linearModel = new LinearRegressionModel();
  private smaModel = new SimpleMovingAverageModel(7);
  private sesModel = new SimpleExponentialSmoothingModel();

  generate(
    prices: number[],
    steps: number,
    config?: { confidenceLevel?: number },
  ): PredictionPoint[] {
    const now = new Date();
    const zScore = config?.confidenceLevel === 99 ? 2.576 : 1.96;

    const ensemblePreds = this.ensemble.predict(prices, steps);

    return ensemblePreds.map((p, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i + 1);
      return {
        date,
        predicted: p.mean,
        lower: p.lower,
        upper: p.upper,
      };
    });
  }

  backtest(
    prices: number[],
    testSize: number,
  ): { modelType: ModelType; accuracy: AccuracyMetrics; predictions: PredictionPoint[]; actuals: { date: Date; price: number }[] }[] {
    if (prices.length < testSize + 2) {
      const empty: AccuracyMetrics = { mae: 0, rmse: 0, mape: 0, sampleSize: 0 };
      const basePreds = prices.map((_, i) => ({
        date: new Date(Date.now() + i * 86400000),
        predicted: prices[prices.length - 1] || 0,
        lower: prices[prices.length - 1] || 0,
        upper: prices[prices.length - 1] || 0,
      }));
      const emptyActuals = prices.slice(-testSize).map((price, i) => ({
        date: new Date(Date.now() + (prices.length - testSize + i) * 86400000),
        price,
      }));
      return [
        { modelType: "linear" as ModelType, accuracy: empty, predictions: basePreds.slice(-testSize), actuals: emptyActuals },
        { modelType: "sma" as ModelType, accuracy: empty, predictions: basePreds.slice(-testSize), actuals: emptyActuals },
        { modelType: "ses" as ModelType, accuracy: empty, predictions: basePreds.slice(-testSize), actuals: emptyActuals },
        { modelType: "ensemble" as ModelType, accuracy: empty, predictions: basePreds.slice(-testSize), actuals: emptyActuals },
      ];
    }

    const trainSize = prices.length - testSize;
    const trainPrices = prices.slice(0, trainSize);
    const testPrices = prices.slice(trainSize);

    const models: [string, (p: number[]) => number[]][] = [
      ["linear", (p: number[]) => {
        const dated = p.map((pr, i) => ({ date: i, price: pr }));
        const m = new LinearRegressionModel();
        m.train(dated);
        return Array.from({ length: testSize }, (_, i) => m.predict(i + 1));
      }],
      ["sma", (p: number[]) => new SimpleMovingAverageModel(7).predict(p, testSize)],
      ["ses", (p: number[]) => new SimpleExponentialSmoothingModel().predict(p, testSize)],
      ["ensemble", (p: number[]) => new EnsembleModel().predict(p, testSize).map(r => r.mean)],
    ];

    return models.map(([name, predictFn]) => {
      const preds = predictFn(trainPrices);
      const actualMap = testPrices;

      const actuals: { date: Date; price: number }[] = actualMap.map((price, i) => ({
        date: new Date(Date.now() + (trainSize + i) * 86400000),
        price,
      }));

      const errors = preds.map((p, i) => p - actualMap[i]);
      const absErrors = errors.map(e => Math.abs(e));
      const pctErrors = errors.map((e, i) => Math.abs(e / (actualMap[i] || 0.01)));

      const mae = absErrors.reduce((s, e) => s + e, 0) / absErrors.length;
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      const mape = pctErrors.reduce((s, e) => s + e * 100, 0) / pctErrors.length;

      const predictionPoints: PredictionPoint[] = preds.map((pred, i) => ({
        date: new Date(Date.now() + (trainSize + i) * 86400000),
        predicted: Math.round(pred * 100) / 100,
        lower: Math.round((pred - 1.96 * Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length)) * 100) / 100,
        upper: Math.round((pred + 1.96 * Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length)) * 100) / 100,
      }));

      return {
        modelType: name as ModelType,
        accuracy: {
          mae: Math.round(mae * 100) / 100,
          rmse: Math.round(rmse * 100) / 100,
          mape: Math.round(mape * 100) / 100,
          sampleSize: testSize,
        },
        predictions: predictionPoints,
        actuals,
      };
    });
  }
}
