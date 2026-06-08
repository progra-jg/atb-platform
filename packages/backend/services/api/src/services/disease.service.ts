import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DiseaseRisk, DiseaseReport } from "../entities/weather.entity";
import { WeatherService } from "./weather.service";

export interface DiseaseModel {
  name: string;
  nameEn: string;
  favorableConditions: (weather: { temp: number; humidity: number; precip: number }) => number;
  affectedCrops: string[];
  preventiveMeasures: string;
  preventiveMeasuresEn: string;
  treatment: string;
  treatmentEn: string;
}

const DISEASE_MODELS: Record<string, DiseaseModel> = {
  mildiou: {
    name: "Mildiou",
    nameEn: "Downy mildew",
    favorableConditions: (w) => {
      if (w.humidity > 80 && w.temp > 18 && w.temp < 25 && w.precip > 10) return 85;
      if (w.humidity > 70 && w.temp > 15 && w.temp < 28) return 60;
      return 25;
    },
    affectedCrops: ["Cacao", "Anacarde", "Manioc"],
    preventiveMeasures: "Assurer une bonne circulation d'air, éviter l'excès d'humidité, rotation des cultures",
    preventiveMeasuresEn: "Ensure good air circulation, avoid excess humidity, crop rotation",
    treatment: "Fongicides à base de cuivre, bouillie bordelaise",
    treatmentEn: "Copper-based fungicides, Bordeaux mixture",
  },
  fusariose: {
    name: "Fusariose",
    nameEn: "Fusarium wilt",
    favorableConditions: (w) => {
      if (w.temp > 25 && w.temp < 32 && w.humidity > 60) return 75;
      if (w.temp > 22 && w.humidity > 50) return 50;
      return 20;
    },
    affectedCrops: ["Coton", "Maïs", "Soja", "Banane"],
    preventiveMeasures: "Utiliser des semences certifiées, rotation avec des légumineuses, drainage du sol",
    preventiveMeasuresEn: "Use certified seeds, rotate with legumes, soil drainage",
    treatment: "Traitement des semences au fongicide, variétés résistantes",
    treatmentEn: "Seed treatment with fungicide, resistant varieties",
  },
  rouille: {
    name: "Rouille",
    nameEn: "Rust",
    favorableConditions: (w) => {
      if (w.humidity > 75 && w.temp > 20 && w.temp < 28 && w.precip > 15) return 80;
      if (w.humidity > 60 && w.temp > 18 && w.temp < 30) return 55;
      return 15;
    },
    affectedCrops: ["Café", "Soja", "Maïs", "Anacarde"],
    preventiveMeasures: "Espacement des plants, élimination des résidus de récolte, variétés tolérantes",
    preventiveMeasuresEn: "Plant spacing, remove crop residue, tolerant varieties",
    treatment: "Fongicides systémiques (triazoles, strobilurines)",
    treatmentEn: "Systemic fungicides (triazoles, strobilurins)",
  },
  pourriture: {
    name: "Pourriture brune",
    nameEn: "Brown rot",
    favorableConditions: (w) => {
      if (w.humidity > 85 && w.temp > 22 && w.precip > 20) return 90;
      if (w.humidity > 75 && w.temp > 20 && w.precip > 10) return 65;
      return 30;
    },
    affectedCrops: ["Cacao", "Ananas", "Manioc", "Banane"],
    preventiveMeasures: "Récolte fréquente, élimination des fruits infectés, taille sanitaire",
    preventiveMeasuresEn: "Frequent harvesting, remove infected fruits, sanitary pruning",
    treatment: "Fongicides appropriés, amélioration du drainage",
    treatmentEn: "Appropriate fungicides, improve drainage",
  },
  cercosporiose: {
    name: "Cercosporiose",
    nameEn: "Cercospora leaf spot",
    favorableConditions: (w) => {
      if (w.humidity > 80 && w.temp > 22 && w.temp < 30) return 70;
      if (w.humidity > 65 && w.temp > 20) return 45;
      return 20;
    },
    affectedCrops: ["Soja", "Coton", "Manioc", "Riz"],
    preventiveMeasures: "Rotation des cultures, semences traitées, labour profond",
    preventiveMeasuresEn: "Crop rotation, treated seeds, deep plowing",
    treatment: "Fongicides foliaires, applications préventives",
    treatmentEn: "Foliar fungicides, preventive applications",
  },
};

const ALL_CROPS = [...new Set(Object.values(DISEASE_MODELS).flatMap((m) => m.affectedCrops))];

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau", "Donga", "Alibori", "Atacora", "Littoral"];

function getRiskLabel(score: number): string {
  if (score >= 80) return "severe";
  if (score >= 60) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

@Injectable()
export class DiseaseService {
  constructor(
    private readonly weatherService: WeatherService,
    @InjectRepository(DiseaseRisk) private riskRepo: Repository<DiseaseRisk>,
    @InjectRepository(DiseaseReport) private reportRepo: Repository<DiseaseReport>,
  ) {}

  async getRisks(region: string, crop: string) {
    const weather = await this.fetchWeatherForRisk(region);
    const applicable = Object.entries(DISEASE_MODELS).filter(([, m]) => m.affectedCrops.includes(crop));
    if (applicable.length === 0) {
      return { region, crop, risks: [], message: "Aucun modèle de maladie disponible pour cette culture" };
    }
    const risks = applicable.map(([key, model]) => {
      const score = Math.round(model.favorableConditions(weather));
      return {
        diseaseKey: key,
        diseaseName: model.name,
        diseaseNameEn: model.nameEn,
        crop,
        riskScore: score,
        riskLevel: getRiskLabel(score),
        description: this.buildRiskDescription(model.name, score, weather),
        preventiveMeasures: model.preventiveMeasures,
        preventiveMeasuresEn: model.preventiveMeasuresEn,
        treatment: model.treatment,
        treatmentEn: model.treatmentEn,
        activeAlert: score >= 60,
        weather: { temp: weather.temp, humidity: weather.humidity, precipitation: weather.precip },
      };
    });
    await this.saveRisksToDb(region, crop, risks);
    return { region, crop, date: new Date().toISOString().split("T")[0], risks };
  }

  async getRegionalRisks(region: string) {
    const weather = await this.fetchWeatherForRisk(region);
    const cropResults = ALL_CROPS.map((crop) => {
      const applicable = Object.entries(DISEASE_MODELS).filter(([, m]) => m.affectedCrops.includes(crop));
      const risks = applicable.map(([key, model]) => {
        const score = Math.round(model.favorableConditions(weather));
        return {
          diseaseKey: key,
          diseaseName: model.name,
          diseaseNameEn: model.nameEn,
          crop,
          riskScore: score,
          riskLevel: getRiskLabel(score),
          description: this.buildRiskDescription(model.name, score, weather),
          preventiveMeasures: model.preventiveMeasures,
          preventiveMeasuresEn: model.preventiveMeasuresEn,
          treatment: model.treatment,
          treatmentEn: model.treatmentEn,
          activeAlert: score >= 60,
        };
      });
      return { crop, risks };
    });
    return { region, date: new Date().toISOString().split("T")[0], cropResults };
  }

  async getCropRisks(crop: string) {
    const results = [];
    for (const region of REGIONS) {
      try {
        const riskData = await this.getRisks(region, crop);
        results.push({ region, risks: riskData.risks });
      } catch {
        continue;
      }
    }
    return { crop, date: new Date().toISOString().split("T")[0], results };
  }

  async getRiskSummary() {
    const summaries = [];
    for (const region of REGIONS) {
      try {
        const weather = await this.fetchWeatherForRisk(region);
        let totalScore = 0;
        let count = 0;
        let highRiskCount = 0;
        let maxRisk = 0;
        let worstDisease = "";
        for (const [key, model] of Object.entries(DISEASE_MODELS)) {
          const score = Math.round(model.favorableConditions(weather));
          totalScore += score;
          count++;
          if (score >= 60) highRiskCount++;
          if (score > maxRisk) {
            maxRisk = score;
            worstDisease = model.name;
          }
        }
        summaries.push({
          region,
          avgRisk: count > 0 ? Math.round(totalScore / count) : 0,
          highRiskCount,
          maxRisk,
          worstDisease,
          riskLevel: count > 0 ? getRiskLabel(totalScore / count) : "low",
        });
      } catch {
        continue;
      }
    }
    const highRiskRegions = summaries.filter((s) => s.riskLevel === "high" || s.riskLevel === "severe");
    return {
      date: new Date().toISOString().split("T")[0],
      totalRegions: summaries.length,
      highRiskRegions: highRiskRegions.length,
      details: summaries,
    };
  }

  async reportDisease(data: {
    farmerId?: string; region: string; crop: string; diseaseName: string;
    estimatedArea: number; severity?: string; imageUrl?: string; description: string;
    coordinates?: any;
  }) {
    const report = this.reportRepo.create({
      ...data,
      status: "reported",
    });
    const saved = await this.reportRepo.save(report);

    const weather = await this.fetchWeatherForRisk(data.region);
    const model = Object.entries(DISEASE_MODELS).find(
      ([, m]) => m.name === data.diseaseName || m.affectedCrops.includes(data.crop),
    );
    if (model) {
      const score = Math.round(model[1].favorableConditions(weather));
      if (score >= 50) {
        await this.riskRepo.update(
          { region: data.region, crop: data.crop, diseaseName: model[1].name },
          { activeAlert: true },
        );
      }
    }
    return { id: saved.id, status: "reported", createdAt: saved.createdAt };
  }

  async getReports(region?: string) {
    const where = region ? { region } : {};
    const reports = await this.reportRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
    return { region: region || "all", total: reports.length, reports };
  }

  private async fetchWeatherForRisk(region: string): Promise<{ temp: number; humidity: number; precip: number }> {
    try {
      const data = await this.weatherService.getForecast(region);
      const forecasts = data.forecasts;
      if (forecasts && forecasts.length > 0) {
        const avgTemp = forecasts.reduce((s: number, d: any) => s + (d.tempMin + d.tempMax) / 2, 0) / forecasts.length;
        const avgHumidity = forecasts.reduce((s: number, d: any) => s + d.humidity, 0) / forecasts.length;
        const totalPrecip = forecasts.reduce((s: number, d: any) => s + d.precipitation, 0);
        return { temp: Math.round(avgTemp * 10) / 10, humidity: Math.round(avgHumidity * 10) / 10, precip: Math.round(totalPrecip * 10) / 10 };
      }
    } catch {
      /* fall through to mock */
    }
    return this.getMockWeather(region);
  }

  private getMockWeather(region: string): { temp: number; humidity: number; precip: number } {
    const northern = ["Alibori", "Borgou", "Atacora", "Donga"];
    const isNorth = northern.includes(region);
    const month = new Date().getMonth();
    const isDrySeason = month >= 11 || month <= 2;
    const baseTemp = isNorth ? (isDrySeason ? 28 : 32) : (isDrySeason ? 26 : 30);
    const baseHumidity = isDrySeason ? 45 : 75;
    const basePrecip = isDrySeason ? 5 : 25;
    return {
      temp: Math.round((baseTemp + Math.random() * 6) * 10) / 10,
      humidity: Math.round((baseHumidity + Math.random() * 20) * 10) / 10,
      precip: Math.round((basePrecip + Math.random() * 15) * 10) / 10,
    };
  }

  private buildRiskDescription(diseaseName: string, score: number, weather: { temp: number; humidity: number; precip: number }): string {
    const level = getRiskLabel(score);
    const descMap: Record<string, string> = {
      low: `Risque faible de ${diseaseName}. Les conditions actuelles (temp: ${weather.temp}°C, HR: ${weather.humidity}%, précip: ${weather.precip}mm) ne sont pas favorables au développement de la maladie.`,
      moderate: `Risque modéré de ${diseaseName}. Les conditions (temp: ${weather.temp}°C, HR: ${weather.humidity}%, précip: ${weather.precip}mm) sont partiellement favorables. Surveillez les cultures.`,
      high: `Risque élevé de ${diseaseName}. Les conditions (temp: ${weather.temp}°C, HR: ${weather.humidity}%, précip: ${weather.precip}mm) sont favorables. Prenez des mesures préventives.`,
      severe: `Risque sévère de ${diseaseName}. Les conditions (temp: ${weather.temp}°C, HR: ${weather.humidity}%, précip: ${weather.precip}mm) sont très favorables. Action immédiate requise.`,
    };
    return descMap[level] || `Risque ${level} de ${diseaseName}.`;
  }

  private async saveRisksToDb(region: string, crop: string, risks: any[]) {
    const today = new Date().toISOString().split("T")[0];
    for (const r of risks) {
      try {
        const existing = await this.riskRepo.findOne({
          where: { region, crop, diseaseName: r.diseaseName, date: today },
        });
        if (existing) {
          existing.riskScore = r.riskScore;
          existing.riskLevel = r.riskLevel;
          existing.activeAlert = r.activeAlert;
          existing.description = r.description;
          await this.riskRepo.save(existing);
        } else {
          const entity = this.riskRepo.create({
            region,
            crop,
            date: today,
            diseaseName: r.diseaseName,
            riskLevel: r.riskLevel,
            riskScore: r.riskScore,
            description: r.description,
            preventiveMeasures: r.preventiveMeasures,
            treatment: r.treatment,
            activeAlert: r.activeAlert,
          });
          await this.riskRepo.save(entity);
        }
      } catch {
        continue;
      }
    }
  }
}
