import { describe, it, expect } from "vitest";
import { computeThreshold, computeLotValue } from "../threshold";
import type { Lot } from "../../types";

function makeLot(overrides: Partial<Lot> = {}): Lot {
  return {
    id: "LOT-001",
    culture: "Cacao",
    origine: "Bénin",
    region: "Plateau",
    quantite: "2 000 kg",
    certification: "GlobalGAP",
    statut: "Disponible",
    prix: 1200,
    producteur: "Koffi Agbozo",
    cooperative: "Coopérative du Plateau",
    note: 85,
    date: "2026-05-15",
    phone: "+229 01 23 45 67",
    ...overrides,
  };
}

describe("computeThreshold", () => {
  it("returns ok for complete standard lot", () => {
    const lot = makeLot({
      stockQuality: { moisture: "8%", impurities: "2%", defects: "1%", netWeight: "1950 kg", grossWeight: "2000 kg", packaging: "Sacs de 50 kg", storageLocation: "Entrepôt A", storageConditions: "Sec, aéré" },
      labResults: [{ id: "LR-001", type: "Qualité", parameter: "Humidité", result: "8%", method: "ISO 6673", laboratory: "Labo Central", date: "2026-05-10" }],
      harvest: { date: "2026-04", location: "Plateau", year: "2026", qualityGrade: "Grade A", conditions: "Ensoleillé" },
    });
    const result = computeThreshold(lot);
    expect(result.severity).toBe("ok");
    expect(result.meetsThreshold).toBe(true);
    expect(result.requiredScore).toBe(40);
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it("returns warning for incomplete standard lot", () => {
    const lot = makeLot({ quantite: "200 kg", prix: 500 });
    const result = computeThreshold(lot);
    expect(result.severity).toBe("warning");
    expect(result.meetsThreshold).toBe(false);
    expect(result.requiredScore).toBe(40);
    expect(result.isLargeLot).toBe(false);
  });

  it("returns blocking for incomplete large lot", () => {
    const lot = makeLot({ quantite: "10 000 kg" });
    const result = computeThreshold(lot);
    expect(result.severity).toBe("blocking");
    expect(result.meetsThreshold).toBe(false);
    expect(result.requiredScore).toBe(70);
    expect(result.isLargeLot).toBe(true);
  });

  it("includes trust score when provided", () => {
    const lot = makeLot({ quantite: "200 kg", prix: 500 });
    const without = computeThreshold(lot);
    const withTrust = computeThreshold(lot, 90);
    expect(withTrust.score).toBeGreaterThan(without.score);
  });

  it("identifies large lot by quantity", () => {
    const lot = makeLot({ quantite: "5000 kg" });
    const result = computeThreshold(lot);
    expect(result.isLargeLot).toBe(true);
    expect(result.requiredScore).toBe(70);
  });

  it("identifies large lot by value", () => {
    const lot = makeLot({ quantite: "1000 kg", prix: 6000 });
    const result = computeThreshold(lot);
    expect(result.isLargeLot).toBe(true);
    expect(result.requiredScore).toBe(70);
  });

  it("clamps score between 0 and 100", () => {
    const lot = makeLot({
      stockQuality: { moisture: "8%", impurities: "2%", defects: "1%", netWeight: "1950 kg", grossWeight: "2000 kg", packaging: "Sacs de 50 kg", storageLocation: "Entrepôt A", storageConditions: "Sec, aéré" },
      labResults: [{ id: "LR-001", type: "Qualité", parameter: "Humidité", result: "8%", method: "ISO 6673", laboratory: "Labo Central", date: "2026-05-10" }],
      harvest: { date: "2026-04", location: "Plateau", year: "2026", qualityGrade: "Grade A", conditions: "Ensoleillé" },
    });
    const result = computeThreshold(lot, 100);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("returns missingRequirements array", () => {
    const lot = makeLot({ quantite: "100 kg", prix: 100 });
    const result = computeThreshold(lot);
    expect(Array.isArray(result.missingRequirements)).toBe(true);
  });
});

describe("computeLotValue", () => {
  it("computes value from quantity and price", () => {
    const lot = makeLot({ quantite: "2 000 kg", prix: 1200 });
    expect(computeLotValue(lot)).toBe(2400000);
  });

  it("strips kg suffix from quantity", () => {
    const lot = makeLot({ quantite: "1500kg", prix: 800 });
    expect(computeLotValue(lot)).toBe(1200000);
  });

  it("returns 0 for zero price", () => {
    const lot = makeLot({ quantite: "1000 kg", prix: 0 });
    expect(computeLotValue(lot)).toBe(0);
  });
});
