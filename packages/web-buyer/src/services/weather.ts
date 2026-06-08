import api from "./api";
import type { RegionForecast, WeatherAlert, CropAdvisory } from "../types/weather";

export async function fetchForecast(region: string): Promise<RegionForecast> {
  const { data } = await api.get(`/weather/forecast/${encodeURIComponent(region)}`);
  return data;
}

export async function fetchAllForecasts(regions: string[]): Promise<RegionForecast[]> {
  const results = await Promise.allSettled(regions.map((r) => fetchForecast(r)));
  const fulfilled: RegionForecast[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") fulfilled.push(r.value);
  }
  return fulfilled;
}

export async function fetchWeatherAlerts(region?: string): Promise<{ alerts: WeatherAlert[] }> {
  const url = region ? `/weather/alerts/${encodeURIComponent(region)}` : "/weather/alerts";
  const { data } = await api.get(url);
  return data;
}

export async function fetchCropAdvisory(region: string, crop: string): Promise<CropAdvisory> {
  const { data } = await api.get(`/weather/advisory/${encodeURIComponent(region)}/${encodeURIComponent(crop)}`);
  return data;
}

export async function fetchWeatherHistory(region: string, days = 30) {
  const { data } = await api.get(`/weather/history/${encodeURIComponent(region)}`, { params: { days } });
  return data;
}
