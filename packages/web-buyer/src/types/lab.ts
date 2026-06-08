export type LabGrade = "excellent" | "good" | "standard" | "below_standard" | "poor";

export interface LabParameter {
  id: string;
  nameKey: string;
  value: string;
  standard: string;
  unit: string;
  status: "pass" | "warning" | "fail" | "info";
  score: number;
}

export interface LabReport {
  reportId: string;
  lotId: string;
  culture: string;
  origin: string;
  sampleDate: string;
  reportDate: string;
  laboratory: string;
  analyst: string;
  overallGrade: LabGrade;
  overallScore: number;
  parameters: LabParameter[];
  conclusionKey: string;
  pdfAvailable: boolean;
}

export const GRADE_CFG: Record<LabGrade, { labelKey: string; color: string; bg: string; icon: string; scoreMin: number }> = {
  excellent:      { labelKey: "lab.grade.excellent",      color: "#059669", bg: "#ecfdf5", icon: "A++", scoreMin: 90 },
  good:           { labelKey: "lab.grade.good",           color: "#2563eb", bg: "#eff6ff", icon: "A",  scoreMin: 80 },
  standard:       { labelKey: "lab.grade.standard",       color: "#d97706", bg: "#fffbeb", icon: "B",  scoreMin: 65 },
  below_standard: { labelKey: "lab.grade.belowStandard",  color: "#dc2626", bg: "#fef2f2", icon: "C",  scoreMin: 50 },
  poor:           { labelKey: "lab.grade.poor",           color: "#991b1b", bg: "#fef2f2", icon: "D",  scoreMin: 0 },
};
