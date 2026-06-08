import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PricePrediction, PredictionAccuracy } from "../../entities/prediction.entity";
import { PredictionRepository, AccuracyRepository, PriceRecordRepository } from "../infrastructure/repository";
import { ModelTrainerService } from "../infrastructure/trainer";
import { PredictionPoint, ModelType, AccuracyMetrics } from "../domain/types";
import { PricePrediction as PricePredictionEntity, PredictionAccuracy as PredictionAccuracyEntity } from "../../entities/prediction.entity";

export interface GeneratePredictionsCommand {
  crop: string;
  region: string;
  days?: number;
}

export interface PredictionResponse {
  id: string;
  crop: string;
  region: string;
  predictedDate: string;
  predictedPrice: number;
  confidenceLower: number;
  confidenceUpper: number;
  modelType: string;
  createdAt: string;
}

export interface BacktestResponse {
  crop: string;
  region: string;
  modelType: ModelType;
  mae: number;
  rmse: number;
  mape: number;
  sampleSize: number;
}

@Injectable()
export class GeneratePredictionsUseCase {
  private readonly logger = new Logger(GeneratePredictionsUseCase.name);

  constructor(
    private readonly predictionRepo: PredictionRepository,
    private readonly trainer: ModelTrainerService,
  ) {}

  async execute(cmd: GeneratePredictionsCommand): Promise<{ success: boolean; data: PredictionResponse[] }> {
    const days = cmd.days || 30;
    if (days < 1 || days > 365) {
      throw new BadRequestException("Days must be between 1 and 365");
    }

    const { predictions, modelType } = await this.trainer.generatePredictions(cmd.crop, cmd.region, days);

    const entities = predictions.map(p => {
      const entity = new PricePredictionEntity();
      entity.id = crypto.randomUUID();
      entity.crop = cmd.crop;
      entity.region = cmd.region;
      entity.predictedDate = p.date;
      entity.predictedPrice = p.predicted;
      entity.confidenceLower = p.lower;
      entity.confidenceUpper = p.upper;
      entity.modelType = modelType;
      return entity;
    });

    const saved = await this.predictionRepo.saveMany(entities);

    this.logger.log(`Generated ${saved.length} predictions for ${cmd.crop}/${cmd.region}`);

    return {
      success: true,
      data: saved.map(p => this.toResponse(p)),
    };
  }

  private toResponse(p: PricePredictionEntity): PredictionResponse {
    return {
      id: p.id,
      crop: p.crop,
      region: p.region,
      predictedDate: p.predictedDate.toISOString(),
      predictedPrice: parseFloat(p.predictedPrice as any),
      confidenceLower: parseFloat(p.confidenceLower as any),
      confidenceUpper: parseFloat(p.confidenceUpper as any),
      modelType: p.modelType,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

@Injectable()
export class GetPredictionsUseCase {
  constructor(
    private readonly predictionRepo: PredictionRepository,
  ) {}

  async execute(
    crop: string,
    region: string,
    from?: string,
    to?: string,
  ): Promise<{ success: boolean; data: PredictionResponse[] }> {
    const predictions = await this.predictionRepo.findByCropRegion(crop, region, from, to);

    return {
      success: true,
      data: predictions.map(p => ({
        id: p.id,
        crop: p.crop,
        region: p.region,
        predictedDate: p.predictedDate.toISOString(),
        predictedPrice: parseFloat(p.predictedPrice as any),
        confidenceLower: parseFloat(p.confidenceLower as any),
        confidenceUpper: parseFloat(p.confidenceUpper as any),
        modelType: p.modelType,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}

@Injectable()
export class BacktestModelUseCase {
  private readonly logger = new Logger(BacktestModelUseCase.name);

  constructor(
    private readonly trainer: ModelTrainerService,
    private readonly accuracyRepo: AccuracyRepository,
  ) {}

  async execute(crop: string, region: string): Promise<{ success: boolean; data: BacktestResponse[] }> {
    const results = await this.trainer.backtestModel(crop, region);
    if (results.length === 0) {
      throw new BadRequestException(`Insufficient data to backtest ${crop}/${region}`);
    }

    const saved: BacktestResponse[] = [];

    for (const result of results) {
      const accuracy = new PredictionAccuracyEntity();
      accuracy.id = crypto.randomUUID();
      accuracy.crop = crop;
      accuracy.region = region;
      accuracy.modelType = result.modelType;
      accuracy.mae = result.accuracy.mae;
      accuracy.rmse = result.accuracy.rmse;
      accuracy.mape = result.accuracy.mape;
      accuracy.sampleSize = result.accuracy.sampleSize;
      accuracy.lastTestedAt = new Date();

      await this.accuracyRepo.save(accuracy);

      saved.push({
        crop,
        region,
        modelType: result.modelType,
        mae: result.accuracy.mae,
        rmse: result.accuracy.rmse,
        mape: result.accuracy.mape,
        sampleSize: result.accuracy.sampleSize,
      });
    }

    this.logger.log(`Backtest completed for ${crop}/${region}: ${saved.length} models evaluated`);

    return { success: true, data: saved };
  }
}

@Injectable()
export class GetModelAccuracyUseCase {
  constructor(
    private readonly accuracyRepo: AccuracyRepository,
  ) {}

  async execute(
    crop: string,
    region: string,
  ): Promise<{ success: boolean; data: AccuracyMetrics & { modelType: ModelType; crop: string; region: string } | null }> {
    const accuracy = await this.accuracyRepo.findLatestByCropRegion(crop, region);
    if (!accuracy) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        modelType: accuracy.modelType as ModelType,
        crop: accuracy.crop,
        region: accuracy.region,
        mae: parseFloat(accuracy.mae as any),
        rmse: parseFloat(accuracy.rmse as any),
        mape: parseFloat(accuracy.mape as any),
        sampleSize: accuracy.sampleSize,
      },
    };
  }
}
