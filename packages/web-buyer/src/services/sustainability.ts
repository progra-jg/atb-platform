import api from "./api";

export interface SustainabilityScore {
  score: number;
  total: number;
  max: number;
  breakdown: { label: string; points: number; max: number; color: string }[];
  level: string;
  color: string;
}

export async function fetchSustainabilityScore(lotId: string): Promise<SustainabilityScore | null> {
  try {
    const { data } = await api.get(`/sustainability/${lotId}`);
    return data;
  } catch {
    return null;
  }
}
