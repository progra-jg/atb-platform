import api from "./api";
import type { LabReport, LabParameter } from "../types/lab";

const CACHE = new Map<string, LabReport>();

function gradeFromScore(score: number) {
  if (score >= 90) return "excellent" as const;
  if (score >= 80) return "good" as const;
  if (score >= 65) return "standard" as const;
  if (score >= 50) return "below_standard" as const;
  return "poor" as const;
}

const MOCK_REPORTS: Record<string, LabReport> = {
  "ATB-2403-001": {
    reportId: "LAB-CACAO-2024-001",
    lotId: "ATB-2403-001",
    culture: "Cacao",
    origin: "Parakou",
    sampleDate: "15/03/2024",
    reportDate: "18/03/2024",
    laboratory: "SGS Bénin — Laboratoire Agronomique",
    analyst: "Dr. Fatima Diallo",
    overallGrade: "excellent",
    overallScore: 94,
    parameters: [
      { id: "moisture", nameKey: "lab.params.moisture", value: "6.2", standard: "< 7.5", unit: "%", status: "pass", score: 95 },
      { id: "bean_count", nameKey: "lab.params.beanCount", value: "98", standard: "≥ 95", unit: "/100g", status: "pass", score: 92 },
      { id: "mouldy", nameKey: "lab.params.mouldy", value: "1.2", standard: "< 3", unit: "%", status: "pass", score: 90 },
      { id: "slaty", nameKey: "lab.params.slaty", value: "0.8", standard: "< 3", unit: "%", status: "pass", score: 96 },
      { id: "fermentation", nameKey: "lab.params.fermentation", value: "92", standard: "≥ 80", unit: "%", status: "pass", score: 93 },
      { id: "impurities", nameKey: "lab.params.impurities", value: "0.5", standard: "< 1", unit: "%", status: "pass", score: 97 },
      { id: "insect_damage", nameKey: "lab.params.insectDamage", value: "0.3", standard: "< 1", unit: "%", status: "pass", score: 98 },
      { id: "aflatoxin", nameKey: "lab.params.aflatoxin", value: "1.2", standard: "< 4", unit: "ppb", status: "pass", score: 91 },
    ],
    conclusionKey: "lab.conclusions.excellent",
    pdfAvailable: true,
  },
  "ATB-2403-002": {
    reportId: "LAB-COTON-2024-001",
    lotId: "ATB-2403-002",
    culture: "Coton",
    origin: "Bohicon",
    sampleDate: "12/03/2024",
    reportDate: "14/03/2024",
    laboratory: "Bureau Veritas Bénin",
    analyst: "Koffi Agboto",
    overallGrade: "good",
    overallScore: 84,
    parameters: [
      { id: "moisture", nameKey: "lab.params.moisture", value: "7.8", standard: "< 8", unit: "%", status: "pass", score: 85 },
      { id: "staple_length", nameKey: "lab.params.stapleLength", value: "30", standard: "≥ 28", unit: "mm", status: "pass", score: 82 },
      { id: "micronaire", nameKey: "lab.params.micronaire", value: "4.2", standard: "3.5-4.9", unit: "µg/in", status: "pass", score: 88 },
      { id: "strength", nameKey: "lab.params.strength", value: "32", standard: "≥ 30", unit: "g/tex", status: "pass", score: 84 },
      { id: "trash", nameKey: "lab.params.trash", value: "2.1", standard: "< 3", unit: "%", status: "pass", score: 80 },
      { id: "color_grade", nameKey: "lab.params.colorGrade", value: "21", standard: "21-31", unit: "—", status: "pass", score: 86 },
    ],
    conclusionKey: "lab.conclusions.good",
    pdfAvailable: true,
  },
  "ATB-2403-005": {
    reportId: "LAB-ANACARDE-2024-001",
    lotId: "ATB-2403-005",
    culture: "Anacarde",
    origin: "Zou",
    sampleDate: "10/03/2024",
    reportDate: "13/03/2024",
    laboratory: "SGS Bénin — Laboratoire Agronomique",
    analyst: "Dr. Fatima Diallo",
    overallGrade: "standard",
    overallScore: 72,
    parameters: [
      { id: "outturn", nameKey: "lab.params.outturn", value: "48", standard: "≥ 50", unit: "lbs", status: "warning", score: 68 },
      { id: "moisture", nameKey: "lab.params.moisture", value: "8.5", standard: "< 8", unit: "%", status: "fail", score: 55 },
      { id: "defective", nameKey: "lab.params.defective", value: "7", standard: "< 5", unit: "%", status: "fail", score: 52 },
      { id: "grade", nameKey: "lab.params.grade", value: "W320", standard: "W240-W320", unit: "—", status: "pass", score: 85 },
      { id: "kernels_split", nameKey: "lab.params.kernelsSplit", value: "3", standard: "< 5", unit: "%", status: "pass", score: 82 },
      { id: "immature", nameKey: "lab.params.immature", value: "4.2", standard: "< 3", unit: "%", status: "fail", score: 50 },
    ],
    conclusionKey: "lab.conclusions.standard",
    pdfAvailable: false,
  },
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

export async function fetchLabReport(lotId: string, culture: string): Promise<LabReport | null> {
  try {
    const { data } = await api.get(`/lab-reports/by-lot/${lotId}`);
    return data;
  } catch {
    await delay(200);
    const cached = CACHE.get(lotId);
    if (cached) return cached;
    const mock = MOCK_REPORTS[lotId];
    if (mock) {
      CACHE.set(lotId, mock);
      return mock;
    }
    const generic: LabReport = {
      reportId: `LAB-${lotId}`,
      lotId,
      culture,
      origin: "—",
      sampleDate: "—",
      reportDate: "—",
      laboratory: "—",
      analyst: "—",
      overallGrade: "standard",
      overallScore: 70,
      parameters: [
        { id: "moisture", nameKey: "lab.params.moisture", value: "—", standard: "—", unit: "%", status: "info", score: 70 },
        { id: "impurities", nameKey: "lab.params.impurities", value: "—", standard: "—", unit: "%", status: "info", score: 70 },
      ],
      conclusionKey: "lab.conclusions.standard",
      pdfAvailable: false,
    };
    return generic;
  }
}
