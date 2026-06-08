import api from "./api";
import type { Farmer } from "../types";

const MOCK: Farmer[] = [
  { id: "ATB-F001", name: "Kouassi Amadou", phone: "+229 01 23 45 67", village: "Zogbodomey", cooperative: "Coop Zou", culture: "Cacao", parcelles: 3, lots: 12, status: "Actif" },
  { id: "ATB-F002", name: "Sika Bénédicte", phone: "+229 98 76 54 32", village: "Bohicon", cooperative: "Coop Zou", culture: "Coton", parcelles: 2, lots: 8, status: "Actif" },
  { id: "ATB-F003", name: "Adéchina Paul", phone: "+229 55 55 55 55", village: "Parakou", cooperative: "Coop Borgou", culture: "Anacarde", parcelles: 5, lots: 20, status: "Actif" },
  { id: "ATB-F004", name: "Mensah Esther", phone: "+229 61 23 45 78", village: "Abomey", cooperative: "Coop Zou", culture: "Cacao", parcelles: 4, lots: 15, status: "Actif" },
  { id: "ATB-F005", name: "Houndé Martin", phone: "+229 97 76 54 31", village: "Kandi", cooperative: "Coop Borgou", culture: "Maïs", parcelles: 6, lots: 10, status: "Inactif" },
  { id: "ATB-F006", name: "Yao Bernard", phone: "+229 01 98 76 54", village: "Savalou", cooperative: "Coop Zou", culture: "Coton", parcelles: 3, lots: 6, status: "Actif" },
  { id: "ATB-F007", name: "Adjoua Rosalie", phone: "+229 55 44 33 22", village: "Tchaourou", cooperative: "Coop Borgou", culture: "Anacarde", parcelles: 2, lots: 9, status: "Actif" },
  { id: "ATB-F008", name: "Gbaguidi David", phone: "+229 62 34 56 78", village: "Dassa", cooperative: "Coop Zou", culture: "Cacao", parcelles: 7, lots: 25, status: "Actif" },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchFarmers(): Promise<Farmer[]> {
  try { const { data } = await api.get("/farmers"); return data; }
  catch { await delay(); return [...MOCK]; }
}
