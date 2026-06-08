import { Injectable, Logger } from "@nestjs/common";
import { PricePredictor } from "../domain/models";
import { PriceRecordRepository } from "./repository";
import { ModelType, PredictionPoint, BacktestResult, AccuracyMetrics } from "../domain/types";

export interface TrainingResult {
  crop: string;
  region: string;
  modelType: ModelType;
  accuracy: AccuracyMetrics;
  predictions: PredictionPoint[];
}

@Injectable()
export class ModelTrainerService {
  private readonly logger = new Logger(ModelTrainerService.name);
  private readonly predictor = new PricePredictor();

  constructor(
    private readonly priceRecordRepo: PriceRecordRepository,
  ) {}

  async generatePredictions(
    crop: string,
    region: string,
    days: number,
  ): Promise<{ predictions: PredictionPoint[]; modelType: ModelType }> {
    const records = await this.priceRecordRepo.findByCrop(crop, 365);
    if (records.length < 2) {
      this.logger.warn(`Not enough price data for ${crop}/${region}: ${records.length} records`);
      const now = new Date();
      const fallback: PredictionPoint[] = Array.from({ length: days }, (_, i) => ({
        date: new Date(now.getTime() + (i + 1) * 86400000),
        predicted: records.length === 1 ? parseFloat(records[0].prixMoyen as any) : 0,
        lower: 0,
        upper: 0,
      }));
      return { predictions: fallback, modelType: "ensemble" };
    }

    const prices = records.map(r => parseFloat(r.prixMoyen as any));
    const steps = Math.min(days, 90);
    const predictions = this.predictor.generate(prices, steps);
    return { predictions, modelType: "ensemble" };
  }

  async backtestModel(
    crop: string,
    region: string,
  ): Promise<TrainingResult[]> {
    const records = await this.priceRecordRepo.findByCrop(crop, 365);
    if (records.length < 10) {
      this.logger.warn(`Not enough data for backtest ${crop}/${region}: ${records.length} records`);
      return [];
    }

    const prices = records.map(r => parseFloat(r.prixMoyen as any));
    const testSize = Math.max(1, Math.floor(prices.length * 0.2));

    const results = this.predictor.backtest(prices, testSize);
    return results.map(r => ({
      crop,
      region,
      modelType: r.modelType,
      accuracy: r.accuracy,
      predictions: r.predictions,
    }));
  }
}
