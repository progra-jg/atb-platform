import { describe, it, expect } from "vitest";
import { computeBondRequirement, verifyCompliance, estimatePremiumBond } from "../compliance";
import type { Order, FarmerProfile, Lot } from "../../types";

const BASE_FARMER: FarmerProfile = {
  anonymousId: "ATB-FARM-0042-GLZ",
  displayName: "Koffi Agbozo",
  cooperative: "Coopérative Agricole",
  localisation: "Glazoué",
  region: "Collines",
  experience: 14,
  didVerified: true,
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
  certifications: [{ id: "CERT-1", type: "EUDR", emetteur: "SGS", emis: "01/01/2026", expire: "31/12/2026", statut: "Valide", blockchain: true }],
  recentWeighings: [],
  transactions: [],
  contact: { managerName: "Marie Zinsou", phone: "+229 01 23 45 678", email: "m.zinsou@coop-glazoue.bj" },
};

describe("computeBondRequirement", () => {
  it("calculates 10% bond from total", () => {
    const order: Order = {
      id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg",
      prixUnitaire: "2 500 FCFA", total: "2 500 000 FCFA",
      statut: "En attente", date: "15/05/2026", livraison: "Cotonou",
    };
    const bond = computeBondRequirement(order);
    expect(bond.required).toBe(250000);
    expect(bond.deposited).toBe(0);
    expect(bond.shortfall).toBe(250000);
    expect(bond.met).toBe(false);
  });

  it("shows met when deposit covers requirement", () => {
    const order: Order = {
      id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg",
      prixUnitaire: "2 500 FCFA", total: "2 500 000 FCFA",
      statut: "Dépôt reçu", date: "15/05/2026", livraison: "Cotonou",
      escrowDeposit: 250000, escrowReleaseDate: "22/05/2026",
    };
    const bond = computeBondRequirement(order);
    expect(bond.met).toBe(true);
    expect(bond.shortfall).toBe(0);
    expect(bond.releaseDate).toBe("22/05/2026");
  });

  it("handles non-numeric total gracefully", () => {
    const order: Order = {
      id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg",
      prixUnitaire: "2 500 FCFA", total: "—",
      statut: "En attente", date: "15/05/2026", livraison: "Cotonou",
    };
    const bond = computeBondRequirement(order);
    expect(bond.required).toBe(0);
    expect(bond.met).toBe(true);
  });
});

describe("verifyCompliance", () => {
  it("returns all passed for a fully compliant farmer", () => {
    const result = verifyCompliance(BASE_FARMER, null, []);
    expect(result.allPassed).toBe(true);
    expect(result.eudrCompliant).toBe(true);
    expect(result.certificationsValid).toBe(true);
    expect(result.didVerified).toBe(true);
    expect(result.bondMet).toBe(true);
  });

  it("fails when EUDR is non-compliant", () => {
    const bad = { ...BASE_FARMER, eudr: { ...BASE_FARMER.eudr, compliant: false } };
    const result = verifyCompliance(bad, null, []);
    expect(result.allPassed).toBe(false);
    expect(result.eudrCompliant).toBe(false);
  });

  it("fails when DID is not verified", () => {
    const bad = { ...BASE_FARMER, didVerified: false };
    const result = verifyCompliance(bad, null, []);
    expect(result.allPassed).toBe(false);
    expect(result.didVerified).toBe(false);
  });

  it("fails bond check when deposit is insufficient", () => {
    const order: Order = {
      id: "O1", lot: "LOT-001", culture: "Anacarde", quantite: "1000 kg",
      prixUnitaire: "2 500 FCFA", total: "10 000 000 FCFA",
      statut: "En attente", date: "15/05/2026", livraison: "Cotonou",
    };
    const result = verifyCompliance(BASE_FARMER, order, []);
    expect(result.allPassed).toBe(false);
    expect(result.bondMet).toBe(false);
    expect(result.bondDetails).not.toBeNull();
  });

  it("returns null bondDetails when no order provided", () => {
    const result = verifyCompliance(BASE_FARMER, null, []);
    expect(result.bondDetails).toBeNull();
  });
});

describe("estimatePremiumBond", () => {
  it("estimates lower bond for higher trust scores", () => {
    const highTrust = estimatePremiumBond(1_000_000, 95);
    const lowTrust = estimatePremiumBond(1_000_000, 30);
    expect(highTrust).toBeLessThan(lowTrust);
  });

  it("never returns less than 5% of total", () => {
    const bond = estimatePremiumBond(1_000_000, 100);
    expect(bond).toBeGreaterThanOrEqual(50000);
  });
});
