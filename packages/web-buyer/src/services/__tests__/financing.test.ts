import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../api";
import {
  checkEligibility, applyForFinancing, getActiveContracts,
  repayContract, getContractById,
} from "../financing";
import type { FinancingEligibility, FinancingContract, FinancingOffer } from "../../types/financing";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Not mocked"))),
    post: vi.fn(() => Promise.reject(new Error("Not mocked"))),
  },
}));

const mockApi = vi.mocked(api);

function eligibility(overrides: Partial<FinancingEligibility> = {}): FinancingEligibility {
  return {
    eligible: true, score: 650, minRequired: 550, maxAmount: 1000000,
    availableOffers: [], reason: undefined,
    activeContracts: 0, totalOutstanding: 0, repaymentRate: 100,
    ...overrides,
  };
}

function contract(overrides: Partial<FinancingContract> = {}): FinancingContract {
  return {
    id: "c1", producteurId: "prod_1", offerId: "offer_transport",
    amount: 200000, interestRate: 10, totalRepayable: 220000,
    status: "active", collateralType: "harvest",
    disbursedAt: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    schedule: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("financing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkEligibility", () => {
    it("sends GET to /financing/eligibility with producteurId and trustScore", async () => {
      const resp = eligibility({ eligible: true, score: 700 });
      mockApi.get.mockResolvedValueOnce({ data: resp });

      const result = await checkEligibility("prod_1", 700);
      expect(result).toEqual(resp);
      expect(mockApi.get).toHaveBeenCalledWith("/financing/eligibility", {
        params: { producteurId: "prod_1", trustScore: 700 },
      });
    });

    it("returns not eligible when score is below minimum", async () => {
      const resp = eligibility({ eligible: false, score: 400, reason: "Score trop bas" });
      mockApi.get.mockResolvedValueOnce({ data: resp });

      const result = await checkEligibility("prod_1", 400);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Score trop bas");
    });

    it("includes available offers when eligible", async () => {
      const offers: FinancingOffer[] = [
        { id: "o1", inputType: "seeds", label: "Semences", maxAmount: 500000, interestRate: 8, durationDays: 180, minTrustScore: 550, collateralRequired: ["harvest"], active: true },
      ];
      const resp = eligibility({ availableOffers: offers });
      mockApi.get.mockResolvedValueOnce({ data: resp });

      const result = await checkEligibility("prod_1", 650);
      expect(result.availableOffers).toHaveLength(1);
      expect(result.availableOffers[0].id).toBe("o1");
    });

    it("rejects on network error", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Network error"));
      await expect(checkEligibility("prod_1", 650)).rejects.toThrow("Network error");
    });
  });

  describe("applyForFinancing", () => {
    const args = ["prod_1", 650, "offer_transport", 200000, "harvest", "REF-123"] as const;

    it("sends POST to /financing/apply with body and params", async () => {
      const resp = contract({ id: "c_new" });
      mockApi.post.mockResolvedValueOnce({ data: resp });

      const result = await applyForFinancing(...args);
      expect(result).toEqual(resp);
      expect(mockApi.post).toHaveBeenCalledWith(
        "/financing/apply",
        { offerId: "offer_transport", amount: 200000, collateralType: "harvest", collateralRef: "REF-123" },
        { params: { producteurId: "prod_1", trustScore: 650 } },
      );
    });

    it("works without collateralRef", async () => {
      const resp = contract();
      mockApi.post.mockResolvedValueOnce({ data: resp });

      const result = await applyForFinancing("prod_1", 650, "offer_transport", 200000, "none");
      expect(result.status).toBe("active");
      expect(mockApi.post).toHaveBeenCalledWith(
        "/financing/apply",
        { offerId: "offer_transport", amount: 200000, collateralType: "none", collateralRef: undefined },
        { params: { producteurId: "prod_1", trustScore: 650 } },
      );
    });

    it("rejects on server error", async () => {
      mockApi.post.mockRejectedValueOnce(new Error("HTTP 400"));
      await expect(applyForFinancing(...args)).rejects.toThrow("HTTP 400");
    });
  });

  describe("getActiveContracts", () => {
    it("sends GET to /financing/active/{producteurId}", async () => {
      const contracts = [contract({ id: "c1" }), contract({ id: "c2" })];
      mockApi.get.mockResolvedValueOnce({ data: contracts });

      const result = await getActiveContracts("prod_1");
      expect(result).toEqual(contracts);
      expect(mockApi.get).toHaveBeenCalledWith("/financing/active/prod_1");
    });

    it("returns empty array when no active contracts", async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      const result = await getActiveContracts("prod_empty");
      expect(result).toEqual([]);
    });
  });

  describe("repayContract", () => {
    it("sends POST to /financing/{id}/repay", async () => {
      const updated = contract({ status: "repaid", repaidAt: new Date().toISOString() });
      mockApi.post.mockResolvedValueOnce({ data: updated });

      const result = await repayContract("c1", 73334, "txn_001");
      expect(result).toEqual(updated);
      expect(mockApi.post).toHaveBeenCalledWith(
        "/financing/c1/repay",
        { amount: 73334, transactionRef: "txn_001" },
      );
    });

    it("rejects when amount is insufficient", async () => {
      mockApi.post.mockRejectedValueOnce(new Error("Montant insuffisant"));
      await expect(repayContract("c1", 100, "txn_002")).rejects.toThrow("Montant insuffisant");
    });
  });

  describe("getContractById", () => {
    it("sends GET to /financing/{id}", async () => {
      const resp = contract({ id: "c_detail" });
      mockApi.get.mockResolvedValueOnce({ data: resp });

      const result = await getContractById("c_detail");
      expect(result).toEqual(resp);
      expect(mockApi.get).toHaveBeenCalledWith("/financing/c_detail");
    });

    it("rejects for unknown contract", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Contrat introuvable"));
      await expect(getContractById("missing")).rejects.toThrow("Contrat introuvable");
    });
  });
});
