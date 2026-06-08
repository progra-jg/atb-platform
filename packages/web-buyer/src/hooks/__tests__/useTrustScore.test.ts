import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import { useTrustScore, useInferredLotTrustScore } from "../useTrustScore";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../../services/farmers", () => ({
  fetchFarmerProfile: vi.fn(() => Promise.resolve({
    id: "ATB-FARM-0001-KAM",
    displayName: "Kouassi Amadou",
    anonymousId: "ATB-FARM-0001-KAM",
    avatar: "KA",
    certifications: ["GlobalGAP", "Bio"],
    credibilityScore: 90,
    trustIndex: 85,
    didVerified: true,
    eudr: { compliant: true },
    phone: "+225 01 02 03 04",
    email: "kouassi@example.com",
    description: "Producteur certifié",
    location: "Bongouanou",
    since: "2018",
    totalLots: 12,
    totalVolume: "50000 kg",
    responseRate: 98,
  })),
}));

vi.mock("../../services/orders", () => ({
  fetchOrders: vi.fn(() => Promise.resolve([
    { id: "ORD-001", statut: "Livrée", lot: "LOT-001", culture: "Cacao", quantite: "2000 kg", prixUnitaire: "1200", total: "2400000", date: "2026-05-01", livraison: "Cotonou", buyerId: "u-buyer-1", producteurId: "ATB-FARM-0001-KAM" },
    { id: "ORD-002", statut: "Livrée", lot: "LOT-002", culture: "Cacao", quantite: "5000 kg", prixUnitaire: "1250", total: "6250000", date: "2026-04-15", livraison: "Cotonou", buyerId: "u-buyer-1", producteurId: "ATB-FARM-0001-KAM" },
  ])),
}));

vi.mock("../../services/reviews", () => ({
  getSellerReviews: vi.fn(() => Promise.resolve([
    { id: "REV-001", orderId: "ORD-001", rating: 5, comment: "Excellent", buyerId: "u-buyer-1", createdAt: "2026-05-02" },
    { id: "REV-002", orderId: "ORD-002", rating: 4, comment: "Très bien", buyerId: "u-buyer-2", createdAt: "2026-04-16" },
  ])),
}));

vi.mock("../../services/lots", () => ({
  fetchLots: vi.fn(() => Promise.resolve([
    { id: "LOT-001", culture: "Cacao", origine: "Côte d'Ivoire", region: "Bongouanou", quantite: "2000 kg", certification: "GlobalGAP", statut: "Disponible", prix: 1200, producteur: "Kouassi Amadou", cooperative: "Coop Bongouanou", note: 90, date: "2026-05-10", phone: "+225 01 02 03 04" },
    { id: "LOT-002", culture: "Cacao", origine: "Côte d'Ivoire", region: "Bongouanou", quantite: "5000 kg", certification: "Bio", statut: "Disponible", prix: 1250, producteur: "Kouassi Amadou", cooperative: "Coop Bongouanou", note: 85, date: "2026-04-20", phone: "+225 01 02 03 04" },
  ])),
}));

describe("useTrustScore", () => {
  it("calculates trust score for a valid farmer", async () => {
    const { result } = renderHook(() => useTrustScore("ATB-FARM-0001-KAM"), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.overall).toBeGreaterThan(0);
    expect(result.current.data!.tier).toBeDefined();
  });

  it("returns null for undefined farmerId", async () => {
    const { result } = renderHook(() => useTrustScore(undefined), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.data).toBeNull();
  });

  it("includes all component scores", async () => {
    const { result } = renderHook(() => useTrustScore("ATB-FARM-0001-KAM"), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.data!.components).toHaveProperty("transactionSuccessRate");
    expect(result.current.data!.components).toHaveProperty("credibilityScore");
    expect(result.current.data!.components).toHaveProperty("trustIndexScore");
    expect(result.current.data!.components).toHaveProperty("dataCompleteness");
    expect(result.current.data!.components).toHaveProperty("didVerified");
    expect(result.current.data!.components).toHaveProperty("eudrCompliance");
  });
});

describe("useInferredLotTrustScore", () => {
  it("returns 85 with max note, cert, available (40+30+15)", () => {
    const { result } = renderHook(() => useInferredLotTrustScore(100, true, true));
    expect(result.current).toBe(85);
  });

  it("returns lower score without certification", () => {
    const { result: r1 } = renderHook(() => useInferredLotTrustScore(50, false, true));
    const { result: r2 } = renderHook(() => useInferredLotTrustScore(50, true, true));
    expect(r1.current).toBeLessThan(r2.current);
  });

  it("penalizes unavailable lots", () => {
    const { result: r1 } = renderHook(() => useInferredLotTrustScore(50, false, false));
    const { result: r2 } = renderHook(() => useInferredLotTrustScore(50, false, true));
    expect(r1.current).toBeLessThan(r2.current);
  });
});
