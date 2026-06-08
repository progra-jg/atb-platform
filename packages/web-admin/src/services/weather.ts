import api from "./api";

export interface WeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  weatherCode: number;
  weatherLabel: string;
}

export interface WeatherAlert {
  id: string;
  region: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  crop?: string;
}

export interface CropAdvisory {
  region: string;
  crop: string;
  plantingConditions: { favorable: boolean; reason: string };
  harvestRisk: { level: string; reason: string };
  diseaseRisk: { level: string; disease: string };
  irrigation: { needed: boolean; amount: number };
}

const MOCK_FORECAST: WeatherDay[] = [
  { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], tempMin: 24, tempMax: 33, precipitation: 2.5, humidity: 68, windSpeed: 12, solarRadiation: 850, weatherCode: 2, weatherLabel: "Partly cloudy" },
  { date: new Date(Date.now() + 2*86400000).toISOString().split("T")[0], tempMin: 23, tempMax: 32, precipitation: 8.0, humidity: 72, windSpeed: 10, solarRadiation: 720, weatherCode: 3, weatherLabel: "Overcast" },
  { date: new Date(Date.now() + 3*86400000).toISOString().split("T")[0], tempMin: 22, tempMax: 30, precipitation: 15.0, humidity: 78, windSpeed: 8, solarRadiation: 550, weatherCode: 61, weatherLabel: "Light rain" },
  { date: new Date(Date.now() + 4*86400000).toISOString().split("T")[0], tempMin: 22, tempMax: 29, precipitation: 25.0, humidity: 82, windSpeed: 6, solarRadiation: 400, weatherCode: 63, weatherLabel: "Moderate rain" },
  { date: new Date(Date.now() + 5*86400000).toISOString().split("T")[0], tempMin: 23, tempMax: 31, precipitation: 10.0, humidity: 74, windSpeed: 9, solarRadiation: 650, weatherCode: 45, weatherLabel: "Foggy" },
  { date: new Date(Date.now() + 6*86400000).toISOString().split("T")[0], tempMin: 25, tempMax: 34, precipitation: 1.0, humidity: 62, windSpeed: 14, solarRadiation: 900, weatherCode: 1, weatherLabel: "Sunny" },
  { date: new Date(Date.now() + 7*86400000).toISOString().split("T")[0], tempMin: 24, tempMax: 33, precipitation: 0.5, humidity: 60, windSpeed: 11, solarRadiation: 880, weatherCode: 1, weatherLabel: "Sunny" },
];

const MOCK_HISTORY: WeatherDay[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
  tempMin: 21 + Math.round(Math.random() * 4),
  tempMax: 29 + Math.round(Math.random() * 6),
  precipitation: Math.round(Math.random() * 30 * 10) / 10,
  humidity: 60 + Math.round(Math.random() * 25),
  windSpeed: 5 + Math.round(Math.random() * 15),
  solarRadiation: 400 + Math.round(Math.random() * 500),
  weatherCode: 1,
  weatherLabel: "",
}));

const MOCK_ALERTS: WeatherAlert[] = [
  { id: "1", region: "Zou", type: "flood", severity: "high", title: "Risque d'inondation", description: "Fortes précipitations attendues dans le Zou. Risque d'inondation dans les zones basses.", startDate: new Date(Date.now() + 2*86400000).toISOString().split("T")[0], endDate: new Date(Date.now() + 4*86400000).toISOString().split("T")[0], active: true, crop: "Cacao" },
  { id: "2", region: "Borgou", type: "heat_stress", severity: "moderate", title: "Stress thermique", description: "Températures élevées dans le Borgou. Stress thermique possible pour les cultures de coton.", startDate: new Date(Date.now() + 1*86400000).toISOString().split("T")[0], endDate: new Date(Date.now() + 3*86400000).toISOString().split("T")[0], active: true, crop: "Coton" },
  { id: "3", region: "Mono", type: "drought", severity: "low", title: "Sécheresse légère", description: "Faible pluviométrie dans le Mono. Surveiller l'humidité du sol.", startDate: new Date(Date.now() - 5*86400000).toISOString().split("T")[0], endDate: new Date(Date.now() + 5*86400000).toISOString().split("T")[0], active: false },
];

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 300));

export async function fetchForecast(region: string): Promise<WeatherDay[]> {
  try { const { data } = await api.get(`/weather/forecast/${region}`); return data; }
  catch { await delay(); return MOCK_FORECAST; }
}

export async function fetchWeatherHistory(region: string): Promise<WeatherDay[]> {
  try { const { data } = await api.get(`/weather/history/${region}`); return data; }
  catch { await delay(); return MOCK_HISTORY; }
}

export async function fetchWeatherAlerts(region?: string): Promise<WeatherAlert[]> {
  try { const { data } = await api.get(region ? `/weather/alerts/${region}` : "/weather/alerts"); return data; }
  catch { await delay(); return MOCK_ALERTS; }
}

export async function fetchCropAdvisory(region: string, crop: string): Promise<CropAdvisory> {
  try { const { data } = await api.get(`/weather/advisory/${region}/${crop}`); return data; }
  catch {
    await delay();
    return {
      region, crop,
      plantingConditions: { favorable: Math.random() > 0.5, reason: "Soil moisture adequate for planting" },
      harvestRisk: { level: Math.random() > 0.6 ? "low" : "moderate", reason: "No extreme weather in forecast" },
      diseaseRisk: { level: Math.random() > 0.5 ? "low" : "moderate", disease: "Downy mildew" },
      irrigation: { needed: Math.random() > 0.6, amount: 25 },
    };
  }
}
