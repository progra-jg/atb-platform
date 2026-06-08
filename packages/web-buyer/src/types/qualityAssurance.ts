export type SampleStatus = "requested" | "collected" | "in_analysis" | "completed" | "rejected";
export type AnalysisResult = "pass" | "fail" | "pending";

export interface QASample {
  id: string;
  lotId: string;
  crop: string;
  producerName: string;
  region: string;
  volumeKg: number;
  sampleSizeKg: number;
  status: SampleStatus;
  requestedBy: string;
  requestedAt: string;
  collectedAt?: string;
  completedAt?: string;
  notes: string;
}

export interface QAAnalysis {
  id: string;
  sampleId: string;
  lotId: string;
  analyst: string;
  analysisDate: string;
  result: AnalysisResult;
  moistureContent?: number;
  impurityRate?: number;
  defectRate?: number;
  grade?: string;
  notes: string;
  certificateId?: string;
}

export interface QACertificate {
  id: string;
  sampleId: string;
  lotId: string;
  crop: string;
  producerName: string;
  region: string;
  analysisDate: string;
  issueDate: string;
  validUntil: string;
  grade: string;
  moistureContent: number;
  impurityRate: number;
  defectRate: number;
  result: AnalysisResult;
  issuedBy: string;
  qrData: string;
}

export interface QAPhoto {
  id: string;
  lotId: string;
  sampleId?: string;
  url: string;
  caption: string;
  takenAt: string;
  takenBy: string;
  type: "field" | "product" | "packaging" | "label";
}

export interface QASummary {
  pendingSamples: number;
  inAnalysis: number;
  completedThisMonth: number;
  passRate: number;
  recentCertificates: number;
}

export const QA_STORAGE_KEY = "atb_qa_v1";
export const QA_PHOTO_KEY = "atb_qa_photo_v1";

export const GRADE_OPTIONS = [
  "Grade A", "Grade B", "Grade C", "Premium", "Standard", "Export Quality",
];

export function generateSampleId(): string {
  return `SMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function generateCertificateId(): string {
  return `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function generatePhotoId(): string {
  return `PHOTO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}
