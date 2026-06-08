import api from "./api";
import type {
  EudrAssessment, EudrRequirementResult, EudrCertificate, EudrStats,
  ComplianceStatus,
} from "../types/eudrFunnel";
import {
  EUDR_REQUIREMENTS, COMPLIANCE_THRESHOLDS,
  EUDR_ASSESSMENT_KEY, EUDR_CERT_KEY,
  getComplianceStatus, generateCertificateId,
} from "../types/eudrFunnel";

const ASSESSMENT_STORE = new Map<string, EudrAssessment>();
const CERT_STORE = new Map<string, EudrCertificate>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : []; }
  catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

export async function assessLotCompliance(
  lotId: string,
  crop: string,
  region: string,
  assessorId: string,
): Promise<EudrAssessment> {
  try {
    const { data } = await api.post("/eudr/assess", { lotId, crop, region, assessorId });
    return data;
  } catch {
    await delay(600);
    const results: EudrRequirementResult[] = EUDR_REQUIREMENTS.map((req) => ({
      requirementId: req.id,
      satisfied: Math.random() > 0.3,
      evidence: "",
      verifiedBy: Math.random() > 0.5 ? assessorId : null,
      verifiedAt: Math.random() > 0.5 ? new Date().toISOString() : null,
      notes: "",
    }));
    const score = Math.round(
      results.reduce((s, r, i) => s + (r.satisfied ? EUDR_REQUIREMENTS[i].weight : 0), 0),
    );
    const status = getComplianceStatus(score);
    const certId = status === "compliant" ? generateCertificateId() : null;
    const assessment: EudrAssessment = {
      lotId, crop, region, score, status,
      requirements: results,
      certificateId: certId,
      certificateUrl: certId ? `/api/eudr/certificate/${certId}` : null,
      validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      assessedAt: new Date().toISOString(),
      assessorId,
    };
    ASSESSMENT_STORE.set(lotId, assessment);
    const all = getLocal<EudrAssessment>(EUDR_ASSESSMENT_KEY);
    const idx = all.findIndex((a) => a.lotId === lotId);
    if (idx >= 0) all[idx] = assessment; else all.push(assessment);
    setLocal(EUDR_ASSESSMENT_KEY, all);

    if (certId) {
      const cert: EudrCertificate = {
        id: certId, lotId, crop,
        producerName: "Producteur Certifié",
        cooperative: "Coopérative EUDR",
        region, score, status,
        issuedAt: new Date().toISOString(),
        validUntil: assessment.validUntil,
        issuedById: assessorId,
        qrData: `${window.location.origin}/verify/${certId}`,
      };
      CERT_STORE.set(certId, cert);
      const certs = getLocal<EudrCertificate>(EUDR_CERT_KEY);
      certs.push(cert);
      setLocal(EUDR_CERT_KEY, certs);
    }

    return assessment;
  }
}

export async function getLotCompliance(lotId: string): Promise<EudrAssessment | null> {
  try {
    const { data } = await api.get(`/eudr/assessment/${lotId}`);
    return data;
  } catch {
    await delay(200);
    return ASSESSMENT_STORE.get(lotId) ?? getLocal<EudrAssessment>(EUDR_ASSESSMENT_KEY).find((a) => a.lotId === lotId) ?? null;
  }
}

export async function getCertificate(certId: string): Promise<EudrCertificate | null> {
  try {
    const { data } = await api.get(`/eudr/certificate/${certId}`);
    return data;
  } catch {
    await delay(200);
    return CERT_STORE.get(certId) ?? getLocal<EudrCertificate>(EUDR_CERT_KEY).find((c) => c.id === certId) ?? null;
  }
}

export async function getEudrStats(): Promise<EudrStats> {
  try {
    const { data } = await api.get("/eudr/stats");
    return data;
  } catch {
    await delay(150);
    const all = getLocal<EudrAssessment>(EUDR_ASSESSMENT_KEY);
    const compliant = all.filter((a) => a.status === "compliant");
    const partial = all.filter((a) => a.status === "partial");
    const cropMap = new Map<string, number>();
    all.forEach((a) => cropMap.set(a.crop, (cropMap.get(a.crop) ?? 0) + 1));
    return {
      totalAssessments: all.length,
      compliantCount: compliant.length,
      partialCount: partial.length,
      nonCompliantCount: all.filter((a) => a.status === "non_compliant").length,
      avgScore: all.length > 0 ? Math.round(all.reduce((s, a) => s + a.score, 0) / all.length) : 0,
      topCrops: [...cropMap.entries()].map(([crop, count]) => ({ crop, count })).slice(0, 5),
      certificatesIssued: compliant.length,
    };
  }
}

export async function verifyRequirement(
  lotId: string,
  requirementId: string,
  verified: boolean,
  notes: string,
): Promise<EudrAssessment> {
  try {
    const { data } = await api.post(`/eudr/assessment/${lotId}/verify`, {
      requirementId, verified, notes,
    });
    return data;
  } catch {
    await delay(200);
    const assessment = ASSESSMENT_STORE.get(lotId) ?? getLocal<EudrAssessment>(EUDR_ASSESSMENT_KEY).find((a) => a.lotId === lotId);
    if (!assessment) throw new Error("Assessment not found");
    const req = assessment.requirements.find((r) => r.requirementId === requirementId);
    if (req) {
      req.satisfied = verified;
      req.notes = notes;
    }
    const score = Math.round(
      assessment.requirements.reduce((s, r, i) => s + (r.satisfied ? EUDR_REQUIREMENTS[i]?.weight ?? 0 : 0), 0),
    );
    assessment.score = score;
    assessment.status = getComplianceStatus(score);
    ASSESSMENT_STORE.set(lotId, assessment);
    const all = getLocal<EudrAssessment>(EUDR_ASSESSMENT_KEY);
    const idx = all.findIndex((a) => a.lotId === lotId);
    if (idx >= 0) all[idx] = assessment;
    setLocal(EUDR_ASSESSMENT_KEY, all);
    return assessment;
  }
}
