export type DemandStatus = "open" | "matched" | "negotiating" | "fulfilled" | "expired" | "cancelled";

export type DemandUrgency = "immediate" | "this_week" | "this_month" | "flexible";

export interface DemandSignal {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  crop: string;
  volumeKg: number;
  maxPriceFcfa: number;
  region: string;
  urgency: DemandUrgency;
  description: string;
  certificationRequired: string[];
  status: DemandStatus;
  matchCount: number;
  responseCount: number;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

export interface DemandMatch {
  id: string;
  demandId: string;
  producerId: string;
  producerName: string;
  producerCooperative: string;
  producerRegion: string;
  proposedVolumeKg: number;
  proposedPriceFcfa: number;
  distanceScore: number;
  trustScoreMatch: number;
  certificationMatch: string[];
  overallScore: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "countered" | "fulfilled";
  createdAt: string;
}

export interface DemandStats {
  activeSignals: number;
  totalMatches: number;
  acceptedMatches: number;
  pendingResponses: number;
  avgTimeToMatch: number;
  topCrops: { crop: string; count: number }[];
  totalVolumeKg: number;
}

export const DEMAND_STORAGE_KEY = "atb_demand_v1";
export const DEMAND_MATCH_KEY = "atb_demand_match_v1";

export const CROPS_LIST = [
  "Cacao", "Coton", "Anacarde", "Café", "Maïs", "Soja",
  "Manioc", "Riz", "Sésame", "Fruits", "Légumes", "Huile de palme",
];

export const URGENCY_LABELS: Record<DemandUrgency, string> = {
  immediate: "demand.urgency.immediate",
  this_week: "demand.urgency.thisWeek",
  this_month: "demand.urgency.thisMonth",
  flexible: "demand.urgency.flexible",
};

export function generateDemandId(): string {
  return `DEM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateMatchId(): string {
  return `DM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
