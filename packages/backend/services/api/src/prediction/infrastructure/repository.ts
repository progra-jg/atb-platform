import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual } from "typeorm";
import { PricePrediction, PredictionAccuracy } from "../../entities/prediction.entity";
import { PriceRecord } from "../../entities/price-record.entity";

export interface PredictionFilter {
  crop?: string;
  region?: string;
  from?: string;
  to?: string;
  modelType?: string;
}

export interface PredictionStats {
  totalPredictions: number;
  totalCrops: number;
  totalRegions: number;
  validatedCount: number;
  avgError: number;
  byModelType: { modelType: string; count: number }[];
}

@Injectable()
export class PredictionRepository {
  constructor(
    @InjectRepository(PricePrediction)
    private readonly repo: Repository<PricePrediction>,
  ) {}

  async save(prediction: PricePrediction): Promise<PricePrediction> {
    return this.repo.save(prediction);
  }

  async saveMany(predictions: PricePrediction[]): Promise<PricePrediction[]> {
    return this.repo.save(predictions);
  }

  async create(data: Partial<PricePrediction>): Promise<PricePrediction> {
    return this.repo.create(data);
  }

  async findById(id: string): Promise<PricePrediction> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Prediction ${id} not found`);
    return p;
  }

  async findByCropRegion(
    crop: string,
    region: string,
    from?: string,
    to?: string,
  ): Promise<PricePrediction[]> {
    const qb = this.repo.createQueryBuilder("p");
    qb.where("p.crop = :crop", { crop });
    qb.andWhere("p.region = :region", { region });
    if (from) qb.andWhere("p.predictedDate >= :from", { from: new Date(from) });
    if (to) qb.andWhere("p.predictedDate <= :to", { to: new Date(to) });
    qb.orderBy("p.predictedDate", "ASC");
    return qb.getMany();
  }

  async findWithFilter(filter: PredictionFilter): Promise<PricePrediction[]> {
    const qb = this.repo.createQueryBuilder("p");
    if (filter.crop) qb.andWhere("p.crop = :crop", { crop: filter.crop });
    if (filter.region) qb.andWhere("p.region = :region", { region: filter.region });
    if (filter.modelType) qb.andWhere("p.modelType = :modelType", { modelType: filter.modelType });
    if (filter.from) qb.andWhere("p.createdAt >= :from", { from: new Date(filter.from) });
    if (filter.to) qb.andWhere("p.createdAt <= :to", { to: new Date(filter.to) });
    qb.orderBy("p.createdAt", "DESC");
    return qb.getMany();
  }

  async findLatestByCropRegion(crop: string, region: string): Promise<PricePrediction | null> {
    return this.repo.findOne({
      where: { crop, region },
      order: { predictedDate: "DESC" },
    });
  }

  async update(id: string, data: Partial<PricePrediction>): Promise<void> {
    await this.repo.update(id, data);
  }

  async getDistinctCrops(): Promise<string[]> {
    const result = await this.repo
      .createQueryBuilder("p")
      .select("DISTINCT p.crop", "crop")
      .getRawMany();
    return result.map(r => r.crop);
  }

  async getDistinctRegions(): Promise<string[]> {
    const result = await this.repo
      .createQueryBuilder("p")
      .select("DISTINCT p.region", "region")
      .getRawMany();
    return result.map(r => r.region);
  }

  async getStats(): Promise<PredictionStats> {
    const total = await this.repo.count();
    const crops = await this.getDistinctCrops();
    const regions = await this.getDistinctRegions();
    const validated = await this.repo.count({ where: { validatedAt: MoreThanOrEqual(new Date("2000-01-01")) } });

    const byModelType = await this.repo
      .createQueryBuilder("p")
      .select("p.modelType", "modelType")
      .addSelect("COUNT(*)", "count")
      .groupBy("p.modelType")
      .getRawMany();

    const avgResult = await this.repo
      .createQueryBuilder("p")
      .select("AVG(p.error)", "avgError")
      .where("p.error IS NOT NULL")
      .getRawOne();

    return {
      totalPredictions: total,
      totalCrops: crops.length,
      totalRegions: regions.length,
      validatedCount: validated,
      avgError: parseFloat(avgResult?.avgError || "0"),
      byModelType: (byModelType || []).map(r => ({
        modelType: r.modelType,
        count: parseInt(r.count),
      })),
    };
  }
}

@Injectable()
export class AccuracyRepository {
  constructor(
    @InjectRepository(PredictionAccuracy)
    private readonly repo: Repository<PredictionAccuracy>,
  ) {}

  async save(accuracy: PredictionAccuracy): Promise<PredictionAccuracy> {
    return this.repo.save(accuracy);
  }

  async create(data: Partial<PredictionAccuracy>): Promise<PredictionAccuracy> {
    return this.repo.create(data);
  }

  async findLatestByCropRegion(crop: string, region: string): Promise<PredictionAccuracy | null> {
    return this.repo.findOne({
      where: { crop, region },
      order: { createdAt: "DESC" },
    });
  }

  async findByCropRegionModel(
    crop: string,
    region: string,
    modelType: string,
  ): Promise<PredictionAccuracy | null> {
    return this.repo.findOne({
      where: { crop, region, modelType },
      order: { createdAt: "DESC" },
    });
  }
}

@Injectable()
export class PriceRecordRepository {
  constructor(
    @InjectRepository(PriceRecord)
    private readonly repo: Repository<PriceRecord>,
  ) {}

  async findByCrop(
    crop: string,
    days: number = 365,
  ): Promise<PriceRecord[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.repo.find({
      where: {
        culture: crop,
        date: MoreThanOrEqual(since.toISOString().split("T")[0]),
      },
      order: { date: "ASC" },
    });
  }

  async findAllCrops(): Promise<string[]> {
    const result = await this.repo
      .createQueryBuilder("pr")
      .select("DISTINCT pr.culture", "culture")
      .getRawMany();
    return result.map(r => r.culture);
  }
}
