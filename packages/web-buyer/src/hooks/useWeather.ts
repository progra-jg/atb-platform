import { useState, useEffect, useCallback, useMemo } from "react";
import type { RegionWeather, WeatherAlert, CropAdvisory } from "../types/weather";
import { fetchAllForecasts, fetchWeatherAlerts, fetchCropAdvisory } from "../services/weather";

const REGIONS = [
  "Alibori", "Atacora", "Atlantique", "Borgou", "Collines",
  "Couffo", "Donga", "Littoral", "Mono", "Ouémé", "Plateau", "Zou",
];

interface UseWeatherReturn {
  regions: RegionWeather[];
  alerts: WeatherAlert[];
  selectedRegion: string | null;
  selectedForecast: RegionWeather | null;
  advisory: CropAdvisory | null;
  loading: boolean;
  alertLoading: boolean;
  advisoryLoading: boolean;
  error: string | null;
  selectRegion: (name: string | null) => void;
  loadAdvisory: (crop: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [regions, setRegions] = useState<RegionWeather[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<CropAdvisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertLoading, setAlertLoading] = useState(true);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allForecasts = await fetchAllForecasts(REGIONS);
      const mapped: RegionWeather[] = allForecasts.map((f) => {
        const today = f.forecasts?.[0];
        const avgTemp = today ? Math.round((today.tempMin + today.tempMax) / 2) : 30;
        return {
          name: f.region,
          temp: avgTemp,
          condition: today?.weatherLabel ?? "—",
          humidity: today ? Math.round(today.humidity) : 60,
          rain: today?.precipitation ?? 0,
          risk: "Faible",
          riskLevel: "low" as const,
          affectedCrops: [],
          forecast: f.forecasts ?? [],
          source: f.source,
        };
      });
      setRegions(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setAlertLoading(true);
    try {
      const { alerts: data } = await fetchWeatherAlerts();
      setAlerts(data.filter((a) => a.active));
    } catch {
      setAlerts([]);
    } finally {
      setAlertLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    loadAlerts();
  }, [loadAll, loadAlerts]);

  const selectRegion = useCallback((name: string | null) => {
    setSelectedRegion((prev) => (prev === name ? null : name));
    setAdvisory(null);
  }, []);

  const loadAdvisory = useCallback(async (crop: string) => {
    if (!selectedRegion) return;
    setAdvisoryLoading(true);
    try {
      const data = await fetchCropAdvisory(selectedRegion, crop);
      setAdvisory(data);
    } catch {
      setAdvisory(null);
    } finally {
      setAdvisoryLoading(false);
    }
  }, [selectedRegion]);

  const selectedForecast = useMemo(() => {
    if (!selectedRegion) return null;
    return regions.find((r) => r.name === selectedRegion) ?? null;
  }, [selectedRegion, regions]);

  return {
    regions,
    alerts,
    selectedRegion,
    selectedForecast,
    advisory,
    loading,
    alertLoading,
    advisoryLoading,
    error,
    selectRegion,
    loadAdvisory,
    refetch: loadAll,
  };
}
