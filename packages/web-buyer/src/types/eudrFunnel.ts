export type ComplianceStatus = "compliant" | "partial" | "non_compliant" | "pending_verification" | "expired";

export interface EudrRequirement {
  id: string;
  key: string;
  labelKey: string;
  descKey: string;
  weight: number;
}

export interface EudrAssessment {
  lotId: string;
  crop: string;
  region: string;
  score: number;
  status: ComplianceStatus;
  requirements: EudrRequirementResult[];
  certificateId: string | null;
  certificateUrl: string | null;
  validUntil: string;
  assessedAt: string;
  assessorId: string;
}

export interface EudrRequirementResult {
  requirementId: string;
  satisfied: boolean;
  evidence: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string;
}

export interface EudrCertificate {
  id: string;
  lotId: string;
  crop: string;
  producerName: string;
  cooperative: string;
  region: string;
  score: number;
  status: ComplianceStatus;
  issuedAt: string;
  validUntil: string;
  issuedById: string;
  qrData: string;
}

export interface EudrStats {
  totalAssessments: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  avgScore: number;
  topCrops: { crop: string; count: number }[];
  certificatesIssued: number;
}

export const EUDR_REQUIREMENTS: EudrRequirement[] = [
  { id: "req_1", key: "geolocation",   labelKey: "eudrFunnel.req.geolocation.label",   descKey: "eudrFunnel.req.geolocation.desc",   weight: 25 },
  { id: "req_2", key: "deforestation",  labelKey: "eudrFunnel.req.deforestation.label",  descKey: "eudrFunnel.req.deforestation.desc",  weight: 30 },
  { id: "req_3", key: "legality",       labelKey: "eudrFunnel.req.legality.label",       descKey: "eudrFunnel.req.legality.desc",       weight: 20 },
  { id: "req_4", key: "traceability",   labelKey: "eudrFunnel.req.traceability.label",   descKey: "eudrFunnel.req.traceability.desc",   weight: 15 },
  { id: "req_5", key: "humanRights",    labelKey: "eudrFunnel.req.humanRights.label",    descKey: "eudrFunnel.req.humanRights.desc",    weight: 10 },
];

export const COMPLIANCE_THRESHOLDS = {
  compliant: 80,
  partial: 50,
  non_compliant: 0,
};

export const EUDR_ASSESSMENT_KEY = "atb_eudr_v1";
export const EUDR_CERT_KEY = "atb_eudr_cert_v1";

export function getComplianceStatus(score: number): ComplianceStatus {
  if (score >= 80) return "compliant";
  if (score >= 50) return "partial";
  return "non_compliant";
}

export function generateCertificateId(): string {
  return `EUDR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
