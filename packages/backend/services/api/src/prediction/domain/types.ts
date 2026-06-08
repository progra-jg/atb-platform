export type CropId = string & { readonly __brand: "CropId" };
export type RegionId = string & { readonly __brand: "RegionId" };
export type ModelType = "linear" | "sma" | "ses" | "ensemble";

export interface PredictionPoint {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
  sampleSize: number;
}

export interface BacktestResult {
  modelType: ModelType;
  accuracy: AccuracyMetrics;
  predictions: PredictionPoint[];
  actuals: { date: Date; price: number }[];
}

export enum PredictionStatus {
  PENDING = "pending",
  GENERATING = "generating",
  COMPLETED = "completed",
  FAILED = "failed",
}

export const PREDICTION_TRANSITIONS: ReadonlyMap<PredictionStatus, ReadonlyArray<PredictionStatus>> = new Map([
  [PredictionStatus.PENDING,    [PredictionStatus.GENERATING, PredictionStatus.FAILED]],
  [PredictionStatus.GENERATING, [PredictionStatus.COMPLETED, PredictionStatus.FAILED]],
  [PredictionStatus.COMPLETED,  []],
  [PredictionStatus.FAILED,     [PredictionStatus.PENDING]],
]);

export const TERMINAL_STATUSES: ReadonlySet<PredictionStatus> = new Set([PredictionStatus.COMPLETED]);

export class PredictionStateMachine {
  static canTransition(from: PredictionStatus, to: PredictionStatus): boolean {
    return PREDICTION_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  static transition(from: PredictionStatus, to: PredictionStatus): PredictionStatus {
    if (!this.canTransition(from, to)) {
      throw new InvalidPredictionTransitionError(from, to);
    }
    return to;
  }

  static isTerminal(status: PredictionStatus): boolean {
    return TERMINAL_STATUSES.has(status);
  }
}

export class InvalidPredictionTransitionError extends Error {
  constructor(from: PredictionStatus, to: PredictionStatus) {
    super(`Invalid prediction state transition: ${from} → ${to}`);
    this.name = "InvalidPredictionTransitionError";
  }
}

export interface PredictionSummary {
  crop: string;
  region: string;
  latestPrediction: PredictionPoint | null;
  modelType: ModelType;
  accuracy: AccuracyMetrics | null;
}

export interface MarketCropInfo {
  crop: string;
  region: string;
  latestPrice: number | null;
  nextPrediction: PredictionPoint | null;
  trend: "up" | "down" | "stable";
  lastUpdated: string | null;
}
