import { describe, it, expect } from "vitest";
import { computeTrustScore, computeLotCompleteness, computeRankingWeight } from "../scoring";
import type { Lot, Order, FarmerProfile, Review } from "../../types";

const BASE_FARMER: FarmerProfile = {
  anonymousId: "ATB-FARM-0042-GLZ",
  displayName: "Koffi Agbozo",
  cooperative: "Coopérative Agricole des Collines de Glazoué",
  localisation: "Glazoué, Collines",
  region: "Collines",
  experience: 14,
  didVerified: true,
  didHash: "did:atb:0x8f3a2b1c",
  credibilityScore: 95,
  trustIndex: 98,
  totalTracedVolume: 42.5,
  volumeUnit: "Tonnes",
  superficie: 4.2,
  parcelleCount: 3,
  parcelles: [],
  center: [8.113, 2.318] as [number, number],
  eudr: { compliant: true, deforestationDetected: false, lastAnalysis: "12 mai 2026", satelliteSource: "Sentinel-2", ndviScore: 0.87, details: "" },
  yieldPrediction: { predicted: 6.8, unit: "T", confidence: 92, confidenceInterval: "±8%", modelVersion: "LSTM v3.2", lastUpdated: "15 mai 2026", history: [] },
  timeline: [],
  certifications: [],
  recentWeighings: [],
  transactions: [],
  contact: { managerName: "Marie Zinsou", phone: "+229 01 23 45 678", email: "m.zinsou@coop-glazoue.bj" },
};

const BASE_LOT: Lot = {
  id: "LOT-001", culture: "Anacarde", origine: "Glazoué", region: "Collines",
  quantite: "5 000 kg", certification: "EUDR", statut: "Disponible",
  prix: 2500, producteur: "Koffi Agbozo", producteurId: "ATB-FARM-0042-GLZ",
  cooperative: "Coopérative Agricole des Collines de Glazoué",
  note: 95, date: "15/05/2026", phone: "+229 01 23 45 678",
};

describe("computeTrustScore", () => {
  it("returns high score for a trusted farmer with delivered orders", () => {
    const orders: Order[] = [
      { id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg", prixUnitaire: "2500 FCFA", total: "2 500 000 FCFA", statut: "Livrée", date: "10/05/2026", livraison: "Cotonou" },
      { id: "O2", lot: "LOT-002", culture: "Soja", quantite: "500 kg", prixUnitaire: "1500 FCFA", total: "750 000 FCFA", statut: "Livrée", date: "01/05/2026", livraison: "Cotonou" },
    ];
    const result = computeTrustScore(BASE_FARMER, orders, [BASE_LOT], []);
    expect(result.overall).toBeGreaterThanOrEqual(85);
    expect(result.tier).toBe("platinum");
    expect(result.components.transactionSuccessRate).toBe(100);
    expect(result.components.didVerified).toBe(100);
    expect(result.components.eudrCompliance).toBe(100);
  });

  it("returns lower score for farmer with no orders and no verification", () => {
    const lowTrustFarmer = { ...BASE_FARMER, didVerified: false, credibilityScore: 50, trustIndex: 40, eudr: { ...BASE_FARMER.eudr, compliant: false } };
    const result = computeTrustScore(lowTrustFarmer, [], [], []);
    expect(result.overall).toBeLessThan(55);
    expect(result.tier).toBe("bronze");
  });

  it("returns medium score for partial data", () => {
    const midFarmer = { ...BASE_FARMER, didVerified: false, credibilityScore: 70, trustIndex: 65 };
    const orders: Order[] = [
      { id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg", prixUnitaire: "2500 FCFA", total: "2 500 000 FCFA", statut: "Confirmée", date: "10/05/2026", livraison: "Cotonou" },
    ];
    const result = computeTrustScore(midFarmer, orders, [], []);
    expect(result.overall).toBeGreaterThanOrEqual(55);
    expect(result.overall).toBeLessThan(85);
    expect(result.tier).toBe("silver");
  });

  it("clamps score between 0 and 100", () => {
    const perfectFarmer = { ...BASE_FARMER, credibilityScore: 100, trustIndex: 100 };
    const orders: Order[] = [
      { id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg", prixUnitaire: "2500 FCFA", total: "2 500 000 FCFA", statut: "Livrée", date: "10/05/2026", livraison: "Cotonou" },
    ];
    const result = computeTrustScore(perfectFarmer, orders, [BASE_LOT], []);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.overall).toBeGreaterThanOrEqual(0);
  });
});

describe("computeLotCompleteness", () => {
  it("returns 100% for a fully populated lot", () => {
    const result = computeLotCompleteness(BASE_LOT);
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it("detects missing fields", () => {
    const partial: Lot = { ...BASE_LOT, phone: "", certification: "", prix: 0, quantite: "" };
    const result = computeLotCompleteness(partial);
    expect(result.score).toBeLessThan(100);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.filled).toBeLessThan(result.total);
  });

  it("handles empty lot gracefully", () => {
    const empty = { id: "EMPTY", culture: "", origine: "", region: "", quantite: "", certification: "", statut: "Disponible" as const, prix: 0, producteur: "", producteurId: "", cooperative: "", note: 0, date: "", phone: "" };
    const result = computeLotCompleteness(empty);
    expect(result.score).toBe(0);
    expect(result.filled).toBe(0);
  });
});

describe("computeRankingWeight", () => {
  it("returns higher weight for available lots with high trust", () => {
    const w1 = computeRankingWeight(95, 100, BASE_LOT);
    const soldLot: Lot = { ...BASE_LOT, statut: "Vendu" };
    const w2 = computeRankingWeight(95, 100, soldLot);
    expect(w1).toBeGreaterThan(w2);
  });

  it("returns lower weight for low-scoring lots", () => {
    const wHigh = computeRankingWeight(90, 100, BASE_LOT);
    const wLow = computeRankingWeight(30, 40, { ...BASE_LOT, note: 20 });
    expect(wHigh).toBeGreaterThan(wLow);
  });
});
