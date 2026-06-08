import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { firstValueFrom } from "rxjs";
import { WeatherForecast, WeatherHistory, WeatherAlert } from "../entities/weather.entity";

const REGIONS_COORDS: Record<string, { lat: number; lon: number }> = {
  Zou: { lat: 7.25, lon: 2.1 },
  Borgou: { lat: 9.85, lon: 2.75 },
  Mono: { lat: 6.55, lon: 1.9 },
  Ouémé: { lat: 6.6, lon: 2.6 },
  Atlantique: { lat: 6.45, lon: 2.35 },
  Collines: { lat: 7.9, lon: 1.9 },
  Couffo: { lat: 7.2, lon: 1.8 },
  Plateau: { lat: 7.5, lon: 2.6 },
  Donga: { lat: 9.5, lon: 1.5 },
  Alibori: { lat: 11.5, lon: 3.0 },
  Atacora: { lat: 10.5, lon: 1.5 },
  Littoral: { lat: 6.37, lon: 2.42 },
};

const WMO_CODES: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Principalement dégagé",
  2: "Partiellement nuageux",
  3: "Nuageux",
  45: "Brumeux",
  48: "Brouillard givrant",
  51: "Légère bruine",
  53: "Bruine modérée",
  55: "Forte bruine",
  56: "Légère bruine verglaçante",
  57: "Forte bruine verglaçante",
  61: "Pluie légère",
  63: "Pluie modérée",
  65: "Forte pluie",
  66: "Pluie verglaçante légère",
  67: "Forte pluie verglaçante",
  71: "Neige légère",
  73: "Neige modérée",
  75: "Forte neige",
  77: "Grains de neige",
  80: "Averses de pluie légères",
  81: "Averses de pluie modérées",
  82: "Averses de pluie violentes",
  85: "Averses de neige légères",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle légère",
  99: "Orage avec forte grêle",
};

const CROP_THRESHOLDS: Record<string, { idealTemp: number[]; maxPrecip: number; minHumidity: number }> = {
  Cacao: { idealTemp: [22, 30], maxPrecip: 60, minHumidity: 60 },
  Maïs: { idealTemp: [20, 35], maxPrecip: 50, minHumidity: 40 },
  Coton: { idealTemp: [22, 35], maxPrecip: 45, minHumidity: 50 },
  Manioc: { idealTemp: [20, 35], maxPrecip: 70, minHumidity: 50 },
  Anacarde: { idealTemp: [22, 34], maxPrecip: 40, minHumidity: 40 },
  Soja: { idealTemp: [20, 32], maxPrecip: 50, minHumidity: 45 },
  Riz: { idealTemp: [20, 35], maxPrecip: 80, minHumidity: 60 },
  Banane: { idealTemp: [24, 33], maxPrecip: 70, minHumidity: 65 },
  Café: { idealTemp: [18, 28], maxPrecip: 50, minHumidity: 55 },
  Ananas: { idealTemp: [22, 32], maxPrecip: 55, minHumidity: 50 },
};

const ALL_REGIONS = Object.keys(REGIONS_COORDS);

@Injectable()
export class WeatherService {
  constructor(
    private readonly http: HttpService,
    @InjectRepository(WeatherForecast) private forecastRepo: Repository<WeatherForecast>,
    @InjectRepository(WeatherHistory) private historyRepo: Repository<WeatherHistory>,
    @InjectRepository(WeatherAlert) private alertRepo: Repository<WeatherAlert>,
  ) {}

  private getCoords(region: string): { lat: number; lon: number } {
    const coords = REGIONS_COORDS[region];
    if (!coords) throw new Error(`Région inconnue: ${region}`);
    return coords;
  }

  private mapWmoCode(code: number): string {
    return WMO_CODES[code] || "Inconnu";
  }

  async getForecast(region: string) {
    const { lat, lon } = this.getCoords(region);
    try {
      const resp: any = await firstValueFrom(
        this.http.get("https://api.open-meteo.com/v1/forecast", {
          params: {
            latitude: lat,
            longitude: lon,
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max,shortwave_radiation_sum",
            timezone: "auto",
            forecast_days: 7,
          },
          timeout: 10000,
        }),
      );
      const d = resp.data?.daily;
      if (!d) throw new Error("Empty response");
      const forecasts = d.time.map((date: string, i: number) => ({
        date,
        tempMin: d.temperature_2m_min[i],
        tempMax: d.temperature_2m_max[i],
        precipitation: d.precipitation_sum[i] || 0,
        humidity: d.relative_humidity_2m_max[i] || 0,
        windSpeed: d.wind_speed_10m_max[i] || 0,
        solarRadiation: d.shortwave_radiation_sum[i] || 0,
        weatherCode: d.weather_code[i],
        weatherLabel: this.mapWmoCode(d.weather_code[i]),
      }));
      try {
        for (const f of forecasts) {
          await this.forecastRepo.upsert(
            {
              region, latitude: lat, longitude: lon, forecastDate: f.date,
              tempMin: f.tempMin, tempMax: f.tempMax, precipitation: f.precipitation,
              humidity: f.humidity, windSpeed: f.windSpeed, solarRadiation: f.solarRadiation,
              weatherCode: f.weatherCode, weatherLabel: f.weatherLabel,
            },
            ["region", "forecastDate"],
          );
        }
      } catch (dbErr: any) {
        console.warn(`[WeatherService] DB upsert failed for ${region}:`, dbErr?.message ?? dbErr);
      }
      return { region, source: "open-meteo", forecasts };
    } catch (err: any) {
      console.warn(`[WeatherService] Open-Meteo failed for ${region}:`, err?.message ?? err);
      return this.getMockForecast(region);
    }
  }

  async getHistory(region: string, days: number = 30) {
    const { lat, lon } = this.getCoords(region);
    try {
      const resp: any = await firstValueFrom(
        this.http.get("https://api.open-meteo.com/v1/forecast", {
          params: {
            latitude: lat,
            longitude: lon,
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max,shortwave_radiation_sum",
            timezone: "auto",
            past_days: days,
            forecast_days: 0,
          },
          timeout: 10000,
        }),
      );
      const d = resp.data?.daily;
      if (!d) throw new Error("Empty response");
      const history = d.time.map((date: string, i: number) => ({
        date,
        tempMin: d.temperature_2m_min?.[i] ?? 0,
        tempMax: d.temperature_2m_max?.[i] ?? 0,
        precipitation: d.precipitation_sum?.[i] ?? 0,
        humidity: d.relative_humidity_2m_max?.[i] ?? 0,
        windSpeed: d.wind_speed_10m_max?.[i] ?? 0,
        solarRadiation: d.shortwave_radiation_sum?.[i] ?? 0,
        weatherCode: d.weather_code?.[i] ?? 0,
        weatherLabel: this.mapWmoCode(d.weather_code?.[i] ?? 0),
      }));
      try {
        for (const h of history) {
          await this.historyRepo.upsert(
            { region, date: h.date, ...h },
            ["region", "date"],
          );
        }
      } catch (dbErr: any) {
        console.warn(`[WeatherService] DB history upsert failed for ${region}:`, dbErr?.message ?? dbErr);
      }
      return { region, source: "open-meteo", days: history.length, history };
    } catch (err: any) {
      console.warn(`[WeatherService] Open-Meteo history failed for ${region}:`, err?.message ?? err);
      return this.getMockHistory(region, days);
    }
  }

  async getAlerts(region?: string) {
    const where = region ? { region } : {};
    const dbAlerts = await this.alertRepo.find({ where, order: { createdAt: "DESC" } });
    if (dbAlerts.length > 0) {
      return { region: region || "all", source: "database", alerts: dbAlerts };
    }
    const mockAlerts = this.getMockAlerts(region);
    return { region: region || "all", source: "mock", alerts: mockAlerts };
  }

  async generateAlerts() {
    const generated: any[] = [];
    for (const region of ALL_REGIONS) {
      try {
        const data = await this.getForecast(region);
        const forecasts = data.forecasts;
        const avgPrecip = forecasts.reduce((s: number, d: any) => s + d.precipitation, 0) / forecasts.length;
        const maxTemp = Math.max(...forecasts.map((d: any) => d.tempMax));
        const minTemp = Math.min(...forecasts.map((d: any) => d.tempMin));
        const maxWind = Math.max(...forecasts.map((d: any) => d.windSpeed));

        const now = new Date();
        const future = new Date(now.getTime() + 7 * 86400000);
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        if (avgPrecip > 40) {
          generated.push(await this.saveAlert({
            region, type: "flood", severity: avgPrecip > 60 ? "high" : "moderate",
            title: "Risque d'inondation",
            description: `Précipitations moyennes de ${avgPrecip.toFixed(1)}mm prévues. Risque d'inondation dans les zones basses.`,
            startDate: fmt(now), endDate: fmt(future), active: true,
          }));
        }
        if (maxTemp > 38) {
          generated.push(await this.saveAlert({
            region, type: "heat_stress", severity: maxTemp > 42 ? "extreme" : "high",
            title: "Vague de chaleur",
            description: `Température maximale de ${maxTemp.toFixed(1)}°C attendue. Stress thermique pour les cultures sensibles.`,
            startDate: fmt(now), endDate: fmt(future), active: true,
          }));
        }
        if (minTemp < 12) {
          generated.push(await this.saveAlert({
            region, type: "frost", severity: minTemp < 8 ? "high" : "moderate",
            title: "Risque de gelée",
            description: `Température minimale de ${minTemp.toFixed(1)}°C attendue. Risque de dégâts sur les cultures sensibles.`,
            startDate: fmt(now), endDate: fmt(future), active: true,
          }));
        }
        if (maxWind > 50) {
          generated.push(await this.saveAlert({
            region, type: "storm", severity: maxWind > 65 ? "high" : "moderate",
            title: "Risque de tempête",
            description: `Rafales de vent jusqu'à ${maxWind.toFixed(1)} km/h attendues. Risque de dégâts matériels et culturaux.`,
            startDate: fmt(now), endDate: fmt(future), active: true,
          }));
        }
        if (avgPrecip < 5 && forecasts.every((d: any) => d.precipitation < 2)) {
          generated.push(await this.saveAlert({
            region, type: "drought", severity: avgPrecip < 2 ? "high" : "moderate",
            title: "Sécheresse",
            description: "Très faibles précipitations prévues pour les 7 prochains jours. Risque de stress hydrique.",
            startDate: fmt(now), endDate: fmt(future), active: true,
          }));
        }
      } catch {
        continue;
      }
    }
    return { generated: generated.length, alerts: generated };
  }

  async getCropAdvisory(region: string, crop: string) {
    const data = await this.getForecast(region);
    const thresholds = CROP_THRESHOLDS[crop];
    if (!thresholds) {
      return { region, crop, advisory: "Aucune donnée disponible pour cette culture" };
    }
    const advisories = data.forecasts.map((day: any) => {
      const avgTemp = (day.tempMin + day.tempMax) / 2;
      const inIdealTemp = avgTemp >= thresholds.idealTemp[0] && avgTemp <= thresholds.idealTemp[1];
      const safePrecip = day.precipitation <= thresholds.maxPrecip;
      const goodHumidity = day.humidity >= thresholds.minHumidity;
      const issues: string[] = [];
      if (inIdealTemp && safePrecip && goodHumidity) {
        return { date: day.date, condition: "favorable", details: "Bonnes conditions pour la culture", avgTemp, precipitation: day.precipitation, humidity: day.humidity, windSpeed: day.windSpeed };
      }
      if (!inIdealTemp) issues.push("température défavorable");
      if (!safePrecip) issues.push("précipitations excessives");
      if (!goodHumidity) issues.push("humidité insuffisante");
      return { date: day.date, condition: "défavorable", details: issues.join(", "), avgTemp, precipitation: day.precipitation, humidity: day.humidity, windSpeed: day.windSpeed };
    });
    return { region, crop, source: data.source, advisories };
  }

  private async saveAlert(data: Partial<WeatherAlert>): Promise<WeatherAlert> {
    const existing = await this.alertRepo.findOne({
      where: { region: data.region, type: data.type, active: true },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.alertRepo.save(existing);
    }
    const alert = this.alertRepo.create(data);
    return this.alertRepo.save(alert);
  }

  private getMockForecast(region: string) {
    const today = new Date();
    const northern = ["Alibori", "Borgou", "Atacora", "Donga"];
    const southern = ["Atlantique", "Littoral", "Mono", "Couffo", "Ouémé", "Plateau"];
    const baseTemp = northern.includes(region) ? 32 : 29;
    const isRainy = southern.includes(region) ? 0.65 : 0.35;
    const forecasts = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today.getTime() + i * 86400000);
      const precip = Math.round(Math.random() * 28 * 10) / 10;
      let weatherCode: number;
      if (precip > 12) weatherCode = 65;
      else if (precip > 5) weatherCode = 63;
      else if (precip > 0.5) weatherCode = 61;
      else if (Math.random() > 0.5) weatherCode = 2;
      else weatherCode = 0;
      if (precip < 0.5 && Math.random() > isRainy) weatherCode = 0;
      return {
        date: date.toISOString().split("T")[0],
        tempMin: Math.round((baseTemp - 7 + Math.random() * 4) * 10) / 10,
        tempMax: Math.round((baseTemp + Math.random() * 5) * 10) / 10,
        precipitation: precip,
        humidity: Math.round((55 + Math.random() * 35) * 10) / 10,
        windSpeed: Math.round((5 + Math.random() * 14) * 10) / 10,
        solarRadiation: Math.round((200 + Math.random() * 400) * 10) / 10,
        weatherCode,
        weatherLabel: this.mapWmoCode(weatherCode),
      };
    });
    return { region, source: "mock", forecasts };
  }

  private getMockHistory(region: string, days: number) {
    const today = new Date();
    const northern = ["Alibori", "Borgou", "Atacora", "Donga"];
    const baseTemp = northern.includes(region) ? 32 : 29;
    const history = Array.from({ length: days }, (_, i) => {
      const date = new Date(today.getTime() - (days - i) * 86400000);
      return {
        date: date.toISOString().split("T")[0],
        tempMin: Math.round((baseTemp - 7 + Math.random() * 4) * 10) / 10,
        tempMax: Math.round((baseTemp + Math.random() * 5) * 10) / 10,
        precipitation: Math.round(Math.random() * 25 * 10) / 10,
        humidity: Math.round((55 + Math.random() * 35) * 10) / 10,
        windSpeed: Math.round((5 + Math.random() * 14) * 10) / 10,
        solarRadiation: Math.round((200 + Math.random() * 400) * 10) / 10,
      };
    });
    return { region, source: "mock", days: history.length, history };
  }

  private getMockAlerts(region?: string) {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const end = new Date(now.getTime() + 7 * 86400000);
    const regions = region ? [region] : ALL_REGIONS;
    return regions.flatMap((r) => [
      {
        region: r, type: "drought", severity: "moderate",
        title: "Surveillance sécheresse", description: "Faibles précipitations constatées. Surveillez l'humidité du sol.",
        startDate: fmt(now), endDate: fmt(end), active: true,
      },
      {
        region: r, type: "heat_stress", severity: "low",
        title: "Surveillance thermique", description: "Températures modérées. Aucun risque immédiat.",
        startDate: fmt(now), endDate: fmt(end), active: false,
      },
    ]);
  }
}
