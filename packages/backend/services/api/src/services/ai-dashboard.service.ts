import { Injectable } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { DiseaseService } from "./disease.service";

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau", "Donga", "Alibori", "Atacora", "Littoral"];
const CROPS = ["Cacao", "Maïs", "Coton", "Manioc", "Anacarde", "Soja", "Riz", "Banane", "Café", "Ananas"];

@Injectable()
export class AIDashboardService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly diseaseService: DiseaseService,
  ) {}

  async getDashboard() {
    const riskSummary = await this.diseaseService.getRiskSummary();
    const weatherSummaries = [];
    for (const region of REGIONS.slice(0, 6)) {
      try {
        const forecast = await this.weatherService.getForecast(region);
        const temps = forecast.forecasts.map((d: any) => (d.tempMin + d.tempMax) / 2);
        weatherSummaries.push({
          region,
          avgTemp: Math.round(temps.reduce((a: number, b: number) => a + b, 0) / temps.length * 10) / 10,
          avgPrecip: Math.round(forecast.forecasts.reduce((s: number, d: any) => s + d.precipitation, 0) / forecast.forecasts.length * 10) / 10,
          source: forecast.source,
        });
      } catch {
        continue;
      }
    }
    const hotspots = riskSummary.details
      .filter((r: any) => r.riskLevel === "high" || r.riskLevel === "severe")
      .map((r: any) => ({ region: r.region, worstDisease: r.worstDisease, maxRisk: r.maxRisk }));

    return {
      date: new Date().toISOString().split("T")[0],
      weatherOverview: weatherSummaries,
      diseaseHotspots: hotspots,
      riskSummary: {
        totalRegions: riskSummary.totalRegions,
        highRiskRegions: riskSummary.highRiskRegions,
      },
    };
  }

  async getCropHealth(region: string, crop: string) {
    const forecast = await this.weatherService.getForecast(region);
    const advisory = await this.weatherService.getCropAdvisory(region, crop);
    const diseaseRisks = await this.diseaseService.getRisks(region, crop);
    const simulatedNdvi = Math.round((0.65 + Math.random() * 0.25) * 100) / 100;

    const temps = forecast.forecasts.map((d: any) => (d.tempMin + d.tempMax) / 2);
    const avgTemp = Math.round(temps.reduce((a: number, b: number) => a + b, 0) / temps.length * 10) / 10;
    const totalPrecip = Math.round(forecast.forecasts.reduce((s: number, d: any) => s + d.precipitation, 0) * 10) / 10;

    const maxRisk = diseaseRisks.risks.length > 0
      ? Math.max(...diseaseRisks.risks.map((r: any) => r.riskScore))
      : 0;

    const healthScore = Math.round(Math.max(0, Math.min(100,
      (simulatedNdvi / 0.9) * 40 +
      (1 - Math.min(avgTemp, 40) / 40) * 15 +
      (1 - Math.min(totalPrecip, 80) / 80) * 15 +
      (1 - maxRisk / 100) * 30
    )));

    const status = healthScore >= 80 ? "good" : healthScore >= 55 ? "fair" : "poor";

    return {
      region,
      crop,
      date: new Date().toISOString().split("T")[0],
      healthScore,
      status,
      ndvi: simulatedNdvi,
      weather: {
        avgTemp,
        totalPrecipitation: totalPrecip,
        favorableDays: advisory.advisories ? advisory.advisories.filter((a: any) => a.condition === "favorable").length : 0,
      },
      diseaseRisks: diseaseRisks.risks.map((r: any) => ({
        diseaseName: r.diseaseName,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
      })),
      recommendations: this.generateRecommendations(healthScore, maxRisk, advisory),
    };
  }

  async getPredictiveAlerts() {
    const alerts: any[] = [];
    for (const region of REGIONS) {
      try {
        const forecast = await this.weatherService.getForecast(region);
        if (!forecast.forecasts || forecast.forecasts.length < 3) continue;
        const avgTemp = forecast.forecasts.reduce((s: number, d: any) => s + (d.tempMin + d.tempMax) / 2, 0) / forecast.forecasts.length;
        const avgHumidity = forecast.forecasts.reduce((s: number, d: any) => s + d.humidity, 0) / forecast.forecasts.length;
        const totalPrecip = forecast.forecasts.reduce((s: number, d: any) => s + d.precipitation, 0);

        for (const crop of CROPS) {
          try {
            const risks = await this.diseaseService.getRisks(region, crop);
            for (const r of risks.risks) {
              if (r.riskScore >= 60) {
                const trend = r.riskScore >= 80 ? "hausse" : "stable";
                alerts.push({
                  region,
                  crop,
                  diseaseName: r.diseaseName,
                  diseaseNameEn: r.diseaseNameEn,
                  riskScore: r.riskScore,
                  riskLevel: r.riskLevel,
                  trend,
                  message: `Risque ${r.riskLevel} de ${r.diseaseName} dans ${region} pour ${crop} dans les prochains jours. ${r.treatment}`,
                  messageEn: `${r.riskLevel.toUpperCase()} risk of ${r.diseaseNameEn} in ${region} for ${crop} in the coming days. ${r.treatmentEn}`,
                  generatedAt: new Date().toISOString(),
                });
              }
            }
          } catch {
            continue;
          }
        }

        if (avgTemp > 36) {
          alerts.push({
            region, crop: "Général", diseaseName: "Stress thermique", diseaseNameEn: "Heat stress",
            riskScore: Math.round((avgTemp / 45) * 100), riskLevel: "high", trend: "hausse",
            message: `Vague de chaleur attendue dans ${region} (${avgTemp.toFixed(1)}°C). Protégez les cultures sensibles.`,
            messageEn: `Heat wave expected in ${region} (${avgTemp.toFixed(1)}°C). Protect sensitive crops.`,
            generatedAt: new Date().toISOString(),
          });
        }
        if (totalPrecip > 120) {
          alerts.push({
            region, crop: "Général", diseaseName: "Inondation potentielle", diseaseNameEn: "Potential flooding",
            riskScore: Math.round((totalPrecip / 200) * 100), riskLevel: "high", trend: "hausse",
            message: `Fortes précipitations attendues dans ${region} (${totalPrecip.toFixed(0)}mm/semaine). Risque d'inondation.`,
            messageEn: `Heavy rainfall expected in ${region} (${totalPrecip.toFixed(0)}mm/week). Flooding risk.`,
            generatedAt: new Date().toISOString(),
          });
        }
      } catch {
        continue;
      }
    }
    const highPriority = alerts.filter((a) => a.riskLevel === "severe" || a.riskLevel === "high");
    return {
      total: alerts.length,
      highPriority: highPriority.length,
      generatedAt: new Date().toISOString(),
      alerts: alerts.slice(0, 50),
    };
  }

  private generateRecommendations(healthScore: number, maxRisk: number, advisory: any): string[] {
    const recs: string[] = [];
    if (healthScore < 55) {
      recs.push("Améliorer l'irrigation et surveiller l'état des cultures de près");
    }
    if (maxRisk >= 60) {
      recs.push("Appliquer des traitements préventifs contre les maladies identifiées");
    }
    if (advisory?.advisories?.some((a: any) => a.condition === "défavorable")) {
      recs.push("Conditions météorologiques défavorables détectées. Planifier des mesures de protection.");
    }
    if (recs.length === 0) {
      recs.push("Bon état général des cultures. Maintenir les pratiques actuelles.");
    }
    return recs;
  }
}
