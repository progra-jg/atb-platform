import api from "./api";
import type { ReportRow } from "../types";

const MOCK: ReportRow[] = [
  { filiere: "Cacao", lots: 120, conformes: 115, nonConformes: 5, taux: 95.8 },
  { filiere: "Coton", lots: 80, conformes: 78, nonConformes: 2, taux: 97.5 },
  { filiere: "Anacarde", lots: 45, conformes: 42, nonConformes: 3, taux: 93.3 },
  { filiere: "Café", lots: 30, conformes: 30, nonConformes: 0, taux: 100 },
  { filiere: "Maïs", lots: 25, conformes: 24, nonConformes: 1, taux: 96 },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchComplianceReports(): Promise<ReportRow[]> {
  try { const { data } = await api.get("/compliance"); return data; }
  catch { await delay(); return [...MOCK]; }
}
