import api from "./api";
import type {
  QASample, QAAnalysis, QACertificate, QAPhoto, QASummary,
  SampleStatus, AnalysisResult,
} from "../types/qualityAssurance";
import {
  QA_STORAGE_KEY, QA_PHOTO_KEY,
  generateSampleId, generateCertificateId, generatePhotoId,
} from "../types/qualityAssurance";

const SAMPLE_STORE = new Map<string, QASample>();
const ANALYSIS_STORE = new Map<string, QAAnalysis>();
const CERT_STORE = new Map<string, QACertificate>();
const PHOTO_STORE = new Map<string, QAPhoto>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : []; }
  catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

export async function requestSample(params: {
  lotId: string; crop: string; producerName: string; region: string;
  volumeKg: number; sampleSizeKg: number; notes: string; requestedBy: string;
}): Promise<QASample> {
  try {
    const { data } = await api.post("/qa/samples", params);
    return data;
  } catch {
    await delay(400);
    const sample: QASample = {
      id: generateSampleId(),
      lotId: params.lotId,
      crop: params.crop,
      producerName: params.producerName,
      region: params.region,
      volumeKg: params.volumeKg,
      sampleSizeKg: params.sampleSizeKg,
      status: "requested",
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      notes: params.notes,
    };
    SAMPLE_STORE.set(sample.id, sample);
    const all = getLocal<QASample>(QA_STORAGE_KEY);
    all.unshift(sample);
    setLocal(QA_STORAGE_KEY, all);
    return sample;
  }
}

export async function getSample(sampleId: string): Promise<QASample | null> {
  try {
    const { data } = await api.get(`/qa/samples/${sampleId}`);
    return data;
  } catch {
    await delay(150);
    return SAMPLE_STORE.get(sampleId) ??
      getLocal<QASample>(QA_STORAGE_KEY).find((s) => s.id === sampleId) ?? null;
  }
}

export async function listSamples(): Promise<QASample[]> {
  try {
    const { data } = await api.get("/qa/samples");
    return data;
  } catch {
    await delay(200);
    const all = getLocal<QASample>(QA_STORAGE_KEY);
    return all.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
}

export async function updateSampleStatus(
  sampleId: string,
  status: SampleStatus,
): Promise<QASample> {
  try {
    const { data } = await api.patch(`/qa/samples/${sampleId}/status`, { status });
    return data;
  } catch {
    await delay(150);
    const sample = SAMPLE_STORE.get(sampleId) ??
      getLocal<QASample>(QA_STORAGE_KEY).find((s) => s.id === sampleId);
    if (!sample) throw new Error("Sample not found");
    sample.status = status;
    if (status === "collected") sample.collectedAt = new Date().toISOString();
    if (status === "completed") sample.completedAt = new Date().toISOString();
    SAMPLE_STORE.set(sampleId, sample);
    const all = getLocal<QASample>(QA_STORAGE_KEY);
    const idx = all.findIndex((s) => s.id === sampleId);
    if (idx >= 0) all[idx] = sample;
    setLocal(QA_STORAGE_KEY, all);
    return sample;
  }
}

export async function submitAnalysis(params: {
  sampleId: string; lotId: string; analyst: string;
  moistureContent: number; impurityRate: number; defectRate: number;
  grade: string; notes: string; result: AnalysisResult;
}): Promise<{ analysis: QAAnalysis; certificate: QACertificate }> {
  try {
    const { data } = await api.post("/qa/analyses", params);
    return data;
  } catch {
    await delay(500);
    const now = new Date().toISOString();
    const certId = generateCertificateId();
    const analysis: QAAnalysis = {
      id: `ANL-${Date.now().toString(36).toUpperCase()}`,
      sampleId: params.sampleId,
      lotId: params.lotId,
      analyst: params.analyst,
      analysisDate: now,
      result: params.result,
      moistureContent: params.moistureContent,
      impurityRate: params.impurityRate,
      defectRate: params.defectRate,
      grade: params.grade,
      notes: params.notes,
      certificateId: certId,
    };
    ANALYSIS_STORE.set(analysis.id, analysis);

    const sample = SAMPLE_STORE.get(params.sampleId) ??
      getLocal<QASample>(QA_STORAGE_KEY).find((s) => s.id === params.sampleId);
    const certificate: QACertificate = {
      id: certId,
      sampleId: params.sampleId,
      lotId: params.lotId,
      crop: sample?.crop ?? "—",
      producerName: sample?.producerName ?? "—",
      region: sample?.region ?? "—",
      analysisDate: now,
      issueDate: now,
      validUntil: new Date(Date.now() + 180 * 86400000).toISOString(),
      grade: params.grade,
      moistureContent: params.moistureContent,
      impurityRate: params.impurityRate,
      defectRate: params.defectRate,
      result: params.result,
      issuedBy: params.analyst,
      qrData: `${window.location.origin}/verify-cert/${certId}`,
    };
    CERT_STORE.set(certId, certificate);
    return { analysis, certificate };
  }
}

export async function getCertificate(certId: string): Promise<QACertificate | null> {
  try {
    const { data } = await api.get(`/qa/certificates/${certId}`);
    return data;
  } catch {
    await delay(150);
    return CERT_STORE.get(certId) ?? null;
  }
}

export async function listCertificates(): Promise<QACertificate[]> {
  try {
    const { data } = await api.get("/qa/certificates");
    return data;
  } catch {
    await delay(200);
    return [...CERT_STORE.values()].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }
}

export async function addPhoto(params: {
  lotId: string; caption: string; takenBy: string; type: QAPhoto["type"];
}): Promise<QAPhoto> {
  try {
    const { data } = await api.post("/qa/photos", params);
    return data;
  } catch {
    await delay(300);
    const photo: QAPhoto = {
      id: generatePhotoId(),
      lotId: params.lotId,
      url: "",
      caption: params.caption,
      takenAt: new Date().toISOString(),
      takenBy: params.takenBy,
      type: params.type,
    };
    PHOTO_STORE.set(photo.id, photo);
    const all = getLocal<QAPhoto>(QA_PHOTO_KEY);
    all.unshift(photo);
    setLocal(QA_PHOTO_KEY, all);
    return photo;
  }
}

export async function listPhotos(lotId?: string): Promise<QAPhoto[]> {
  try {
    const url = lotId ? `/qa/photos?lotId=${lotId}` : "/qa/photos";
    const { data } = await api.get(url);
    return data;
  } catch {
    await delay(150);
    const all = getLocal<QAPhoto>(QA_PHOTO_KEY);
    const filtered = lotId ? all.filter((p) => p.lotId === lotId) : all;
    return filtered.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  }
}

export async function getQASummary(): Promise<QASummary> {
  try {
    const { data } = await api.get("/qa/summary");
    return data;
  } catch {
    await delay(150);
    const samples = getLocal<QASample>(QA_STORAGE_KEY);
    const certs = [...CERT_STORE.values()];
    const completed = samples.filter((s) => s.status === "completed");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      pendingSamples: samples.filter((s) => s.status === "requested").length,
      inAnalysis: samples.filter((s) => s.status === "in_analysis" || s.status === "collected").length,
      completedThisMonth: completed.filter((s) => s.completedAt && s.completedAt >= monthStart).length,
      passRate: completed.length > 0
        ? Math.round((certs.filter((c) => c.result === "pass").length / Math.max(certs.length, 1)) * 100)
        : 0,
      recentCertificates: certs.length,
    };
  }
}
