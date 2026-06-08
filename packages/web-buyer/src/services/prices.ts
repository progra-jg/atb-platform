import api from "./api";

export interface PriceHistoryPoint {
  date: string;
  avg: number;
  min: number;
  max: number;
}

export interface PriceHistoryCrop {
  culture: string;
  data: PriceHistoryPoint[];
}

export async function fetchPriceHistory(culture?: string, months = 12): Promise<PriceHistoryCrop[]> {
  const params: any = { months };
  if (culture) params.culture = culture;
  const { data } = await api.get("/prices/history", { params });
  return data;
}
