import api from "./api";
import type { VerificationPoint } from "../types";

const MOCK_POINTS: VerificationPoint[] = [
  {
    id: "VP-ZOU-001",
    name: "Hub Zou — Coopérative Agrisud",
    region: "Zou",
    ville: "Abomey",
    cooperative: "Coopérative Agrisud Bénin",
    coordinates: [7.185, 1.998],
    capacityTonnes: 200,
    services: ["inspection", "stockage temporaire", "certification"],
    contact: "+229 01 23 45 67 01",
    inspectionFeeFcfa: 5000,
  },
  {
    id: "VP-BOR-001",
    name: "Hub Borgou — Coopérative Terroir",
    region: "Borgou",
    ville: "Parakou",
    cooperative: "Coopérative Terroir du Borgou",
    coordinates: [9.345, 2.625],
    capacityTonnes: 350,
    services: ["inspection", "stockage temporaire"],
    contact: "+229 01 23 45 67 02",
    inspectionFeeFcfa: 5000,
  },
  {
    id: "VP-MON-001",
    name: "Hub Mono — Coopérative Lacustre",
    region: "Mono",
    ville: "Lokossa",
    cooperative: "Coopérative Lacustre du Mono",
    coordinates: [6.638, 1.715],
    capacityTonnes: 150,
    services: ["inspection", "stockage temporaire", "conditionnement"],
    contact: "+229 01 23 45 67 03",
    inspectionFeeFcfa: 3500,
  },
  {
    id: "VP-OUA-001",
    name: "Hub Ouémé — Coopérative Vallée",
    region: "Ouémé",
    ville: "Porto-Novo",
    cooperative: "Coopérative Vallée de l'Ouémé",
    coordinates: [6.497, 2.605],
    capacityTonnes: 300,
    services: ["inspection", "stockage temporaire", "certification", "transit portuaire"],
    contact: "+229 01 23 45 67 04",
    inspectionFeeFcfa: 4500,
  },
  {
    id: "VP-ATL-001",
    name: "Hub Atlantique — Coopérative Côtière",
    region: "Atlantique",
    ville: "Cotonou",
    cooperative: "Coopérative Côtière de l'Atlantique",
    coordinates: [6.365, 2.418],
    capacityTonnes: 500,
    services: ["inspection", "stockage temporaire", "certification", "transit portuaire", "export"],
    contact: "+229 01 23 45 67 05",
    inspectionFeeFcfa: 6000,
  },
];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * 300));

export async function fetchVerificationPoints(): Promise<VerificationPoint[]> {
  try {
    const { data } = await api.get("/verification-points");
    return (data ?? []).map(sanitizePoint);
  } catch {
    await delay();
    return [...MOCK_POINTS];
  }
}

export function findPointByRegion(region: string, points: VerificationPoint[]): VerificationPoint | undefined {
  return points.find((p) => p.region === region);
}

function sanitizePoint(d: any): VerificationPoint {
  return {
    id: String(d.id ?? ""),
    name: String(d.name ?? "").slice(0, 200),
    region: String(d.region ?? "").slice(0, 100),
    ville: String(d.ville ?? "").slice(0, 100),
    cooperative: String(d.cooperative ?? "").slice(0, 200),
    coordinates: Array.isArray(d.coordinates) && d.coordinates.length === 2
      ? [Number(d.coordinates[0]) || 0, Number(d.coordinates[1]) || 0]
      : [0, 0],
    capacityTonnes: Math.max(0, Number(d.capacityTonnes) || 0),
    services: Array.isArray(d.services) ? d.services.map((s: any) => String(s).slice(0, 100)) : [],
    contact: String(d.contact ?? "").slice(0, 30),
    inspectionFeeFcfa: Math.max(0, Number(d.inspectionFeeFcfa) || 0),
  };
}
