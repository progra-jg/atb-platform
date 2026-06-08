import api from "./api";
import type { DemandSignal, DemandMatch, DemandStats, DemandStatus, DemandUrgency } from "../types/demand";
import { DEMAND_STORAGE_KEY, DEMAND_MATCH_KEY, generateDemandId, generateMatchId } from "../types/demand";

const SIGNAL_STORE = new Map<string, DemandSignal>();
const MATCH_STORE = new Map<string, DemandMatch>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : []; }
  catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

const MOCK_PRODUCERS = [
  { id: "prod_1", name: "Koffi A.", coop: "Coopérative Atlantique", region: "Atlantique" },
  { id: "prod_2", name: "Mariam B.", coop: "Union des Producteurs", region: "Borgou" },
  { id: "prod_3", name: "Jean K.", coop: "Coopérative Côtière", region: "Mono" },
  { id: "prod_4", name: "Fatima S.", coop: "Coop Agri Durable", region: "Collines" },
  { id: "prod_5", name: "Pierre D.", coop: "Coopérative du Zou", region: "Zou" },
];

export async function createDemandSignal(
  buyerId: string,
  buyerName: string,
  buyerCompany: string,
  crop: string,
  volumeKg: number,
  maxPriceFcfa: number,
  region: string,
  urgency: DemandUrgency,
  description: string,
  certificationRequired: string[],
): Promise<DemandSignal> {
  try {
    const { data } = await api.post("/demand", {
      buyerId, buyerName, buyerCompany, crop, volumeKg, maxPriceFcfa,
      region, urgency, description, certificationRequired,
    });
    return data;
  } catch {
    await delay(400);
    const id = generateDemandId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const signal: DemandSignal = {
      id, buyerId, buyerName, buyerCompany, crop, volumeKg, maxPriceFcfa,
      region, urgency, description, certificationRequired,
      status: "open", matchCount: 0, responseCount: 0,
      createdAt: now, expiresAt, updatedAt: now,
    };
    SIGNAL_STORE.set(id, signal);
    const all = getLocal<DemandSignal>(DEMAND_STORAGE_KEY);
    all.push(signal);
    setLocal(DEMAND_STORAGE_KEY, all);

    const matches = generateMockMatches(signal);
    matches.forEach((m) => {
      MATCH_STORE.set(m.id, m);
      signal.matchCount += 1;
    });
    const allMatches = getLocal<DemandMatch>(DEMAND_MATCH_KEY);
    allMatches.push(...matches);
    setLocal(DEMAND_MATCH_KEY, allMatches);

    SIGNAL_STORE.set(id, signal);
    return signal;
  }
}

function generateMockMatches(signal: DemandSignal): DemandMatch[] {
  return MOCK_PRODUCERS.map((p, i) => {
    const distanceScore = Math.min(100, 100 - Math.random() * 40);
    const trustScoreMatch = Math.round(60 + Math.random() * 35);
    const certMatch = signal.certificationRequired.filter(() => Math.random() > 0.4);
    const overallScore = Math.round(
      distanceScore * 0.3 + trustScoreMatch * 0.4 + (certMatch.length / Math.max(signal.certificationRequired.length, 1)) * 100 * 0.3,
    );
    return {
      id: generateMatchId(),
      demandId: signal.id,
      producerId: p.id,
      producerName: p.name,
      producerCooperative: p.coop,
      producerRegion: p.region,
      proposedVolumeKg: Math.round(signal.volumeKg * (0.5 + Math.random() * 0.8)),
      proposedPriceFcfa: Math.round(signal.maxPriceFcfa * (0.85 + Math.random() * 0.2)),
      distanceScore: Math.round(distanceScore),
      trustScoreMatch,
      certificationMatch: certMatch,
      overallScore,
      message: `Je peux fournir ${Math.round(signal.volumeKg * (0.5 + Math.random() * 0.8))} kg de ${signal.crop} de qualité.`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  });
}

export async function getDemandSignals(buyerId: string): Promise<DemandSignal[]> {
  try {
    const { data } = await api.get(`/demand?buyerId=${buyerId}`);
    return data;
  } catch {
    await delay(200);
    const all = getLocal<DemandSignal>(DEMAND_STORAGE_KEY);
    return all.filter((d) => d.buyerId === buyerId).reverse();
  }
}

export async function getAllOpenDemands(): Promise<DemandSignal[]> {
  try {
    const { data } = await api.get("/demand/open");
    return data;
  } catch {
    await delay(200);
    const all = getLocal<DemandSignal>(DEMAND_STORAGE_KEY);
    return all.filter((d) => d.status === "open").reverse();
  }
}

export async function getDemandMatches(demandId?: string): Promise<DemandMatch[]> {
  try {
    const url = demandId ? `/demand/${demandId}/matches` : "/demand/matches";
    const { data } = await api.get(url);
    return data;
  } catch {
    await delay(200);
    const all = getLocal<DemandMatch>(DEMAND_MATCH_KEY);
    if (demandId) return all.filter((m) => m.demandId === demandId).sort((a, b) => b.overallScore - a.overallScore);
    return all.sort((a, b) => b.overallScore - a.overallScore);
  }
}

export async function respondToMatch(
  matchId: string,
  status: "accepted" | "rejected" | "countered",
  counterMessage?: string,
): Promise<DemandMatch> {
  try {
    const { data } = await api.post(`/demand/match/${matchId}/respond`, { status, counterMessage });
    return data;
  } catch {
    await delay(200);
    const match = MATCH_STORE.get(matchId);
    if (!match) throw new Error("Match not found");
    match.status = status;
    if (counterMessage) match.message = counterMessage;
    MATCH_STORE.set(matchId, match);
    const all = getLocal<DemandMatch>(DEMAND_MATCH_KEY);
    const idx = all.findIndex((m) => m.id === matchId);
    if (idx >= 0) all[idx] = match;
    setLocal(DEMAND_MATCH_KEY, all);
    return match;
  }
}

export async function getDemandStats(): Promise<DemandStats> {
  try {
    const { data } = await api.get("/demand/stats");
    return data;
  } catch {
    await delay(150);
    const all = getLocal<DemandSignal>(DEMAND_STORAGE_KEY);
    const matches = getLocal<DemandMatch>(DEMAND_MATCH_KEY);
    const cropMap = new Map<string, number>();
    all.forEach((d) => cropMap.set(d.crop, (cropMap.get(d.crop) ?? 0) + 1));
    return {
      activeSignals: all.filter((d) => d.status === "open").length,
      totalMatches: matches.length,
      acceptedMatches: matches.filter((m) => m.status === "accepted").length,
      pendingResponses: matches.filter((m) => m.status === "pending").length,
      avgTimeToMatch: 2.4,
      topCrops: [...cropMap.entries()].map(([crop, count]) => ({ crop, count })).slice(0, 5),
      totalVolumeKg: all.reduce((s, d) => s + d.volumeKg, 0),
    };
  }
}

export async function updateDemandStatus(id: string, status: DemandStatus): Promise<DemandSignal> {
  try {
    const { data } = await api.patch(`/demand/${id}/status`, { status });
    return data;
  } catch {
    await delay(200);
    const signal = SIGNAL_STORE.get(id);
    if (!signal) throw new Error("Demand not found");
    signal.status = status;
    signal.updatedAt = new Date().toISOString();
    SIGNAL_STORE.set(id, signal);
    const all = getLocal<DemandSignal>(DEMAND_STORAGE_KEY);
    const idx = all.findIndex((d) => d.id === id);
    if (idx >= 0) all[idx] = signal;
    setLocal(DEMAND_STORAGE_KEY, all);
    return signal;
  }
}
