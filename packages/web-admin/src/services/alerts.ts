import api from "./api";
import type { AlertItem } from "../types";

const MOCK: AlertItem[] = [
  { id: 1, type: "Déforestation", severity: "Haute", parcelle: "P-1024", culture: "Cacao", date: "2024-03-20", status: "Non résolu", surface: "1.2 ha", coordinates: "7.2345°N, 2.1234°E" },
  { id: 2, type: "Déforestation", severity: "Moyenne", parcelle: "P-2048", culture: "Coton", date: "2024-03-19", status: "En cours", surface: "0.8 ha", coordinates: "7.3456°N, 2.2345°E" },
  { id: 3, type: "Déforestation", severity: "Basse", parcelle: "P-3072", culture: "Anacarde", date: "2024-03-18", status: "Résolu", surface: "0.5 ha", coordinates: "7.4567°N, 2.3456°E" },
  { id: 4, type: "Déforestation", severity: "Haute", parcelle: "P-4096", culture: "Cacao", date: "2024-03-17", status: "Non résolu", surface: "2.1 ha", coordinates: "7.5678°N, 2.4567°E" },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchAlerts(): Promise<AlertItem[]> {
  try { const { data } = await api.get("/alerts"); return data; }
  catch { await delay(); return [...MOCK]; }
}

export async function runComplianceCheck(): Promise<{ total: number; results: any[] }> {
  const { data } = await api.post("/compliance/check-all");
  return data;
}

export async function checkParcelleCompliance(parcelleId: string): Promise<any> {
  const { data } = await api.post(`/compliance/check/${parcelleId}`);
  return data;
}
