import { Controller, Get, Post, Param, Body, Query, Logger } from "@nestjs/common";
import {
  GeneratePredictionsUseCase,
  GetPredictionsUseCase,
  BacktestModelUseCase,
  GetModelAccuracyUseCase,
} from "../application/usecases";
import { PredictionRepository, AccuracyRepository, PriceRecordRepository } from "../infrastructure/repository";
import { GeneratePredictionDto, PredictionFilterDto } from "./dto";
import { ModelType, PredictionPoint, MarketCropInfo } from "../domain/types";

@Controller("api/prediction")
export class PredictionController {
  private readonly logger = new Logger(PredictionController.name);

  constructor(
    private readonly generatePredictions: GeneratePredictionsUseCase,
    private readonly getPredictions: GetPredictionsUseCase,
    private readonly backtestModel: BacktestModelUseCase,
    private readonly getModelAccuracy: GetModelAccuracyUseCase,
    private readonly predictionRepo: PredictionRepository,
    private readonly accuracyRepo: AccuracyRepository,
    private readonly priceRecordRepo: PriceRecordRepository,
  ) {}

  @Post("generate")
  async generate(@Body() dto: GeneratePredictionDto) {
    this.logger.log(`Generate predictions: crop=${dto.crop}, region=${dto.region}, days=${dto.days || 30}`);
    return this.generatePredictions.execute({
      crop: dto.crop,
      region: dto.region,
      days: dto.days,
    });
  }

  @Get(":crop/:region")
  async getPredictionsByCropRegion(
    @Param("crop") crop: string,
    @Param("region") region: string,
    @Query() filter: PredictionFilterDto,
  ) {
    return this.getPredictions.execute(crop, region, filter.from, filter.to);
  }

  @Post("backtest")
  async backtest(@Body() body: { crop: string; region: string }) {
    this.logger.log(`Run backtest: crop=${body.crop}, region=${body.region}`);
    return this.backtestModel.execute(body.crop, body.region);
  }

  @Get("accuracy/:crop/:region")
  async getAccuracy(
    @Param("crop") crop: string,
    @Param("region") region: string,
  ) {
    return this.getModelAccuracy.execute(crop, region);
  }

  @Get("summary")
  async getSummary() {
    const crops = await this.predictionRepo.getDistinctCrops();
    const regions = await this.predictionRepo.getDistinctRegions();
    const stats = await this.predictionRepo.getStats();
    return { success: true, data: { crops, regions, stats } };
  }

  @Get("markets")
  async getMarkets() {
    const priceCrops = await this.priceRecordRepo.findAllCrops();
    const info: MarketCropInfo[] = [];

    for (const crop of priceCrops) {
      const latest = await this.predictionRepo.findLatestByCropRegion(crop, "default");
      const latestPrice = null;
      const trend: "up" | "down" | "stable" = "stable";

      let nextPrediction: PredictionPoint | null = null;
      if (latest) {
        nextPrediction = {
          date: new Date(latest.predictedDate),
          predicted: parseFloat(latest.predictedPrice as any),
          lower: parseFloat(latest.confidenceLower as any),
          upper: parseFloat(latest.confidenceUpper as any),
        };
      }

      info.push({
        crop,
        region: "default",
        latestPrice,
        nextPrediction,
        trend,
        lastUpdated: latest?.createdAt?.toISOString() || null,
      });
    }

    return { success: true, data: info };
  }
}
