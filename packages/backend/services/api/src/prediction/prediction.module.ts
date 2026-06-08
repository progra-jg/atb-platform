import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PricePrediction, PredictionAccuracy } from "../entities/prediction.entity";
import { PriceRecord } from "../entities/price-record.entity";

import { PredictionController } from "./presentation/controller";
import { PredictionRepository, AccuracyRepository, PriceRecordRepository } from "./infrastructure/repository";
import { ModelTrainerService } from "./infrastructure/trainer";
import {
  GeneratePredictionsUseCase,
  GetPredictionsUseCase,
  BacktestModelUseCase,
  GetModelAccuracyUseCase,
} from "./application/usecases";

@Module({
  imports: [TypeOrmModule.forFeature([PricePrediction, PredictionAccuracy, PriceRecord])],
  controllers: [PredictionController],
  providers: [
    PredictionRepository,
    AccuracyRepository,
    PriceRecordRepository,
    ModelTrainerService,
    GeneratePredictionsUseCase,
    GetPredictionsUseCase,
    BacktestModelUseCase,
    GetModelAccuracyUseCase,
  ],
  exports: [PredictionRepository, AccuracyRepository, PriceRecordRepository],
})
export class PredictionModule {}
