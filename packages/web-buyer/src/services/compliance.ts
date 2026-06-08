import api from "./api";

export interface ComplianceSummary {
  totalParcelles: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  deforestationAlerts: number;
  lastAnalysis: string;
  complianceRate: number;
}

export async function fetchComplianceSummary(): Promise<ComplianceSummary | null> {
  try {
    const { data } = await api.get("/compliance");
    const items = Array.isArray(data) ? data : [];
    const total = items.length;
    const compliant = items.filter((c: any) => c.compliant === true).length;
    const nonCompliant = items.filter((c: any) => c.compliant === false).length;
    const alerts = items.filter((c: any) => c.deforestationDetected === true).length;
    const dates = items.map((c: any) => c.lastAnalysis).filter(Boolean).sort().reverse();
    return {
      totalParcelles: total,
      compliant,
      nonCompliant,
      pending: total - compliant - nonCompliant,
      deforestationAlerts: alerts,
      lastAnalysis: dates[0] || "",
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
  } catch {
    return null;
  }
}
