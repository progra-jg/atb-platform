import api from "./api";
import type { FarmerProfile, FarmerCard } from "../types";

const MOCK_FARMER: FarmerProfile = {
  anonymousId: "ATB-FARM-0042-GLZ",
  anonymous: false,
  displayName: "Koffi Agbozo",
  cooperative: "Coopérative Agricole des Collines de Glazoué",
  localisation: "Glazoué, Collines",
  region: "Collines",
  experience: 14,
  didVerified: true,
  didHash: "did:atb:0x8f3a2b1c9e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b",
  credibilityScore: 95,
  trustIndex: 98,
  totalTracedVolume: 42.5,
  volumeUnit: "Tonnes",
  superficie: 4.2,
  parcelleCount: 3,
  parcelles: [
    {
      id: "PARC-001",
      culture: "Anacarde",
      superficie: 2.1,
      coordinates: [
        [8.112, 2.315],
        [8.118, 2.322],
        [8.115, 2.328],
        [8.109, 2.325],
        [8.107, 2.318],
      ],
    },
    {
      id: "PARC-002",
      culture: "Soja",
      superficie: 1.3,
      coordinates: [
        [8.105, 2.308],
        [8.110, 2.314],
        [8.107, 2.320],
        [8.102, 2.316],
      ],
    },
    {
      id: "PARC-003",
      culture: "Anacarde",
      superficie: 0.8,
      coordinates: [
        [8.120, 2.310],
        [8.125, 2.316],
        [8.122, 2.322],
        [8.117, 2.319],
      ],
    },
  ],
  center: [8.113, 2.318],
  eudr: {
    compliant: true,
    deforestationDetected: false,
    lastAnalysis: "12 mai 2026",
    satelliteSource: "Sentinel-2 (ESA)",
    ndviScore: 0.87,
    details:
      "Analyse NDVI par réseau U-Net sur image Sentinel-2 du 10 mai 2026 (résolution 10 m/pixel). Aucune variation de couvert forestier détectée depuis l'enregistrement de la parcelle en 2021. Score de confiance de l'analyse : 98,3 %.",
  },
  yieldPrediction: {
    predicted: 6.8,
    unit: "Tonnes",
    confidence: 92,
    confidenceInterval: "±8%",
    modelVersion: "LSTM v3.2",
    lastUpdated: "15 mai 2026",
    history: [
      { year: "2022-2023", value: 4.2 },
      { year: "2023-2024", value: 5.1 },
      { year: "2024-2025", value: 5.8 },
      { year: "2025-2026", value: 6.3 },
    ],
  },
  certifications: [
    { id: "EUDR-FARM-0042-2026", type: "EUDR Due Diligence", emetteur: "SGS Bénin", emis: "12/05/2026", expire: "31/12/2026", statut: "Valide", blockchain: true },
    { id: "GG-FARM-0042-2025", type: "GlobalGAP", emetteur: "Control Union", emis: "15/06/2024", expire: "15/06/2025", statut: "Valide", blockchain: true },
    { id: "BIO-FARM-0042-2026", type: "Certification Bio", emetteur: "Ecocert", emis: "02/03/2026", expire: "02/03/2027", statut: "Valide", blockchain: false },
    { id: "LAB-FARM-0042-001", type: "Analyse Sol & Eau", emetteur: "Laboratoire National", emis: "10/01/2026", expire: "10/07/2026", statut: "Valide", blockchain: false },
  ],
  timeline: [
    { step: 1, title: "Inscription plateforme ATB", date: "15/01/2021", lieu: "Glazoué", acteur: "Koffi Agbozo", desc: "Enregistrement avec vérification d'identité et géolocalisation parcellaire", status: "completed" },
    { step: 2, title: "Première certification EUDR", date: "22/06/2022", lieu: "Glazoué", acteur: "SGS Bénin", desc: "Audit de conformité — zéro déforestation confirmé sur l'ensemble des parcelles", status: "completed" },
    { step: 3, title: "Déploiement balances IoT", date: "08/03/2023", lieu: "Glazoué", acteur: "ATB Tech", desc: "Installation de 2 balances connectées (ATB-BAL-017, ATB-BAL-009) avec transmission automatique des pesées", status: "completed" },
    { step: 4, title: "Intégration blockchain", date: "14/11/2023", lieu: "Cotonou", acteur: "ATB Blockchain", desc: "Ancrage du DID et des certificats sur Hyperledger Besu — 1ère transaction on-chain", status: "completed" },
    { step: 5, title: "Modèle IA LSTM actif", date: "02/02/2025", lieu: "Glazoué", acteur: "ATB Data Lab", desc: "Déploiement du modèle de prédiction de rendement — entraîné sur 4 saisons de données historiques", status: "completed" },
    { step: 6, title: "Dernière analyse EUDR conforme", date: "12/05/2026", lieu: "Glazoué", acteur: "Sentinel-2 / U-Net", desc: "Analyse NDVI automatique — aucun changement de couvert forestier détecté. Score NDVI: 87%", status: "active" },
  ],
  recentWeighings: [
    { date: "12 mai 2026", weight: 1240, culture: "Anacarde", lotId: "LOT-0241", deviceId: "ATB-BAL-017" },
    { date: "08 mai 2026", weight: 980, culture: "Anacarde", lotId: "LOT-0238", deviceId: "ATB-BAL-017" },
    { date: "28 avr 2026", weight: 1560, culture: "Soja", lotId: "LOT-0229", deviceId: "ATB-BAL-009" },
    { date: "15 avr 2026", weight: 820, culture: "Anacarde", lotId: "LOT-0220", deviceId: "ATB-BAL-017" },
    { date: "02 avr 2026", weight: 1100, culture: "Soja", lotId: "LOT-0212", deviceId: "ATB-BAL-009" },
  ],
  transactions: [
    {
      id: "TX-2026-0051",
      date: "14 mai 2026",
      type: "Vente",
      montant: "3 845 000",
      statut: "Confirmée",
      blockchain: { hash: "0x7d8f3a2b1c9e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f", block: "#1,204,441", timestamp: "14 mai 2026 — 09:32 UTC" },
    },
    {
      id: "TX-2026-0042",
      date: "28 avr 2026",
      type: "Livraison",
      montant: "—",
      statut: "Livrée",
      blockchain: { hash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", block: "#1,198,720", timestamp: "28 avr 2026 — 14:15 UTC" },
    },
    {
      id: "TX-2026-0037",
      date: "10 avr 2026",
      type: "Avance",
      montant: "750 000",
      statut: "Remboursée",
      blockchain: { hash: "0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8", block: "#1,195,312", timestamp: "10 avr 2026 — 11:08 UTC" },
    },
    {
      id: "TX-2026-0029",
      date: "25 mar 2026",
      type: "Vente",
      montant: "2 890 000",
      statut: "Confirmée",
      blockchain: { hash: "0xf1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1", block: "#1,189,887", timestamp: "25 mar 2026 — 16:45 UTC" },
    },
  ],
  contact: {
    managerName: "Marie Zinsou",
    phone: "+229 01 23 45 678",
    email: "m.zinsou@coop-glazoue.bj",
  },
};

const FARMER_IDS: Record<string, string> = {
  "Koffi Agbozo": "ATB-FARM-0042-GLZ",
  "Kouassi Amadou": "ATB-FARM-0001-KAM",
  "Moussa Diallo": "ATB-FARM-0002-MDI",
  "Bakari Toundé": "ATB-FARM-0003-BTO",
  "Gisèle Hounkpatin": "ATB-FARM-0004-GHO",
  "Sébastien Ahouansou": "ATB-FARM-0005-SAH",
};

export function getFarmerAnonymousId(name: string): string {
  return FARMER_IDS[name] || "";
}

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function mapApiFarmerToCard(f: any): FarmerCard {
  const h = simpleHash(f.id || f.name);
  const lots = f.lots || f.parcelles || 1;
  return {
    anonymousId: f.id,
    displayName: f.name,
    cooperative: f.cooperative || "",
    localisation: f.village || f.localisation || "",
    experience: f.experience || 5 + (h % 10),
    didVerified: true,
    credibilityScore: 70 + (h % 26),
    trustIndex: 70 + ((h * 7) % 26),
    totalTracedVolume: +(lots * (3 + (h % 20) / 10)).toFixed(1),
    volumeUnit: "T",
    culture: f.culture || "",
    superficie: f.superficie || f.parcelles * 1.5 || 2,
    parcelleCount: f.parcelles || lots,
  };
}

export async function fetchFarmersList(): Promise<FarmerCard[]> {
  try {
    const { data } = await api.get("/farmers");
    if (Array.isArray(data)) return data.map(mapApiFarmerToCard);
    return [...MOCK_FARMERS_LIST];
  } catch {
    await delay(300);
    return [...MOCK_FARMERS_LIST];
  }
}

function mapApiFarmerToProfile(data: any): FarmerProfile {
  return {
    ...data,
    yieldPrediction: data.yieldPrediction || {
      predicted: 0, unit: "T", confidence: 0,
      confidenceInterval: "±0%", modelVersion: "N/A",
      lastUpdated: "—", history: [],
    },
    parcelles: (data.parcelles || []).map((p: any) => ({
      ...p,
      coordinates: Array.isArray(p.coordinates)
        ? p.coordinates
        : p.coordinates?.coordinates?.[0]?.map((c: string) =>
            typeof c === "string" ? c.split(" ").map(Number) : c
          ) || [],
    })),
  };
}

export async function fetchFarmerProfile(id: string): Promise<FarmerProfile> {
  try {
    const { data } = await api.get(`/farmers/${id}`);
    return mapApiFarmerToProfile(data);
  } catch {
    await delay();
    const validIds = Object.values(FARMER_IDS);
    if (validIds.includes(id)) {
      return MOCK_FARMER;
    }
    throw new Error("Producteur introuvable");
  }
}

const MOCK_FARMERS_LIST: FarmerCard[] = [
  { anonymousId: "ATB-FARM-0042-GLZ", displayName: "Koffi Agbozo", cooperative: "Coopérative Agricole des Collines de Glazoué", localisation: "Glazoué, Collines", experience: 14, didVerified: true, credibilityScore: 95, trustIndex: 98, totalTracedVolume: 42.5, volumeUnit: "T", culture: "Anacarde", superficie: 4.2, parcelleCount: 3 },
  { anonymousId: "ATB-FARM-0001-KAM", displayName: "Kouassi Amadou", cooperative: "Coopérative Agricole du Zou", localisation: "Bohicon, Zou", experience: 8, didVerified: true, credibilityScore: 88, trustIndex: 92, totalTracedVolume: 28.3, volumeUnit: "T", culture: "Coton", superficie: 3.6, parcelleCount: 2 },
  { anonymousId: "ATB-FARM-0002-MDI", displayName: "Moussa Diallo", cooperative: "Coopérative du Borgou", localisation: "Kandi, Borgou", experience: 6, didVerified: true, credibilityScore: 82, trustIndex: 85, totalTracedVolume: 18.7, volumeUnit: "T", culture: "Coton", superficie: 2.8, parcelleCount: 2 },
  { anonymousId: "ATB-FARM-0003-BTO", displayName: "Bakari Toundé", cooperative: "Coopérative du Borgou", localisation: "Parakou, Borgou", experience: 15, didVerified: true, credibilityScore: 95, trustIndex: 97, totalTracedVolume: 55.1, volumeUnit: "T", culture: "Anacarde", superficie: 6.1, parcelleCount: 4 },
  { anonymousId: "ATB-FARM-0004-GHO", displayName: "Gisèle Hounkpatin", cooperative: "Coopérative de l'Ouémé", localisation: "Kétou, Ouémé", experience: 5, didVerified: false, credibilityScore: 78, trustIndex: 80, totalTracedVolume: 12.0, volumeUnit: "T", culture: "Café", superficie: 1.5, parcelleCount: 1 },
  { anonymousId: "ATB-FARM-0005-SAH", displayName: "Sébastien Ahouansou", cooperative: "Coopérative du Mono", localisation: "Grand-Popo, Mono", experience: 3, didVerified: true, credibilityScore: 85, trustIndex: 88, totalTracedVolume: 9.4, volumeUnit: "T", culture: "Cacao", superficie: 1.8, parcelleCount: 1 },
];
