import { describe, it, expect } from "vitest";
import { rankLots, rankLotsWithReason, recordClick, resetBandit, RANKING_WEIGHTS, type RankingContext, type RankedLot } from "../ranking";
import type { Lot } from "../../types";

function makeLot(id: string, overrides: Partial<Lot> = {}): Lot {
  return {
    id, culture: "Anacarde", origine: "Glazoué", region: "Collines",
    quantite: "5 000 kg", certification: "EUDR", statut: "Disponible",
    prix: 2500, producteur: "Koffi Agbozo", producteurId: "ATB-FARM-0042-GLZ",
    cooperative: "Coopérative Agricole des Collines de Glazoué",
    note: 95, date: "15/05/2026", phone: "+229 01 23 45 678",
    ...overrides,
  };
}

const CTX: RankingContext = {
  preferredCrop: "Anacarde",
  preferredRegion: "Collines",
  prefersCertified: true,
};

describe("rankLots", () => {
  it("returns all input lots", () => {
    const lots = [makeLot("A"), makeLot("B")];
    const ranked = rankLots(lots, CTX);
    expect(ranked).toHaveLength(2);
  });

  it("prefers matching crop over non-matching", () => {
    const lots = [
      makeLot("A", { culture: "Coton" }),
      makeLot("B", { culture: "Anacarde" }),
    ];
    const ranked = rankLots(lots, CTX);
    expect(ranked[0].id).toBe("B");
  });

  it("prefers matching region over non-matching", () => {
    const lots = [
      makeLot("A", { region: "Atacora" }),
      makeLot("B", { region: "Collines" }),
    ];
    const ranked = rankLots(lots, CTX);
    expect(ranked[0].id).toBe("B");
  });

  it("prefers certified lots when prefersCertified is true", () => {
    const lots = [
      makeLot("A", { certification: "" }),
      makeLot("B", { certification: "EUDR" }),
    ];
    const ranked = rankLots(lots, CTX);
    expect(ranked[0].id).toBe("B");
  });

  it("ranks higher note lots above lower note lots when other factors equal", () => {
    const lots = [
      makeLot("A", { note: 50 }),
      makeLot("B", { note: 95, producteur: "Yao Konan" }),
    ];
    const ranked = rankLots(lots, { preferredCrop: undefined, preferredRegion: undefined, prefersCertified: false });
    expect(ranked[0].id).toBe("B");
  });

  it("boosts small producers with high trust via rotation", () => {
    const lots = [
      makeLot("A", { producteur: "Gros Producteur", note: 60 }),
      makeLot("A1", { id: "A1", producteur: "Gros Producteur", note: 60 }),
      makeLot("A2", { id: "A2", producteur: "Gros Producteur", note: 60 }),
      makeLot("B", { producteur: "Petit Producteur", note: 90 }),
    ];
    const ranked = rankLots(lots, { preferredCrop: undefined, preferredRegion: undefined, prefersCertified: false });
    expect(ranked[0]._scores.rotation).toBeGreaterThan(ranked[1]._scores.rotation);
  });

  it("appends _rankWeight and _scores", () => {
    const ranked = rankLots([makeLot("A")], CTX);
    expect(ranked[0]).toHaveProperty("_rankWeight");
    expect(ranked[0]).toHaveProperty("_scores");
    expect(ranked[0]._scores).toHaveProperty("relevance");
    expect(ranked[0]._scores).toHaveProperty("trust");
    expect(ranked[0]._scores).toHaveProperty("quality");
    expect(ranked[0]._scores).toHaveProperty("rotation");
  });

  it("weights sum to 1.0", () => {
    const total = RANKING_WEIGHTS.relevance + RANKING_WEIGHTS.trust + RANKING_WEIGHTS.quality + RANKING_WEIGHTS.rotation;
    expect(total).toBeCloseTo(1.0, 5);
  });

  it("is deterministic (same input → same output order)", () => {
    const lots = [
      makeLot("A", { culture: "Coton", note: 80 }),
      makeLot("B", { culture: "Anacarde", note: 70 }),
      makeLot("C", { culture: "Coton", note: 90, producteur: "Yao" }),
    ];
    const first = rankLots(lots, CTX);
    const second = rankLots(lots, CTX);
    expect(first.map((l) => l.id)).toEqual(second.map((l) => l.id));
    expect(first.map((l) => l._rankWeight)).toEqual(second.map((l) => l._rankWeight));
  });

  it("data quality bonus from images boosts rank", () => {
    const lots = [
      makeLot("A", { images: undefined }),
      makeLot("B", {
        images: [{ id: "img1", url: "https://example.com/img.svg", caption: "Photo 1", type: "product" }],
      }),
    ];
    const ranked = rankLots(lots, { preferredCrop: undefined, preferredRegion: undefined, prefersCertified: false });
    expect(ranked[0]._scores.quality).toBeGreaterThan(ranked[1]._scores.quality);
    expect(ranked[0].id).toBe("B");
  });

  it("uses trustScore from context when provided", () => {
    const lots = [makeLot("A"), makeLot("B", { note: 50 })];
    const ranked = rankLots(lots, {
      ...CTX,
      trustScores: { "A": 30, "B": 95 },
    });
    expect(ranked[0].id).toBe("B");
  });
});

describe("rankLotsWithReason", () => {
  it("includes _dominantReason on each lot", () => {
    const lots = [makeLot("A")];
    const ranked = rankLotsWithReason(lots, CTX);
    expect(ranked[0]).toHaveProperty("_dominantReason");
    expect(ranked[0]._dominantReason).toMatch(/^ranking\./);
  });
});

describe("recordClick (legacy)", () => {
  it("does not throw (no-op)", () => {
    expect(() => recordClick("LOT-001", true)).not.toThrow();
    expect(() => recordClick("LOT-002", false)).not.toThrow();
  });
});

describe("resetBandit (legacy)", () => {
  it("does not throw (no-op)", () => {
    expect(() => resetBandit()).not.toThrow();
  });
});
