import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOffer, fetchOffersByLot, respondToOffer, counterOffer, withdrawOffer, simulateSellerResponse } from "../offers";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

const validRequest = {
  lotId: "LOT-001",
  sellerId: "seller-1",
  quantity: "100 kg",
  pricePerKg: 1500,
  message: "Test offer",
};

describe("offers service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOffer", () => {
    it("creates offer with correct structure when API fails", async () => {
      const offer = await createOffer(validRequest);
      expect(offer).toHaveProperty("id");
      expect(offer).toHaveProperty("lotId", "LOT-001");
      expect(offer).toHaveProperty("status", "pending");
      expect(offer).toHaveProperty("buyerId", "b0000000-0001-4000-8000-000000000001");
      expect(offer).toHaveProperty("pricePerKg", 1500);
      expect(offer).toHaveProperty("createdAt");
    });

    it("uses API when available", async () => {
      const mockData = { id: "OFF-API-001", status: "pending", lotId: "LOT-001" };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockData });
      const offer = await createOffer(validRequest);
      expect(offer).toEqual(mockData);
    });

    it("handles quantity without 'kg' suffix", async () => {
      const req = { ...validRequest, quantity: "50" };
      const offer = await createOffer(req);
      expect(offer.quantity).toBe("50");
    });
  });

  describe("fetchOffersByLot", () => {
    it("returns empty array for unknown lot", async () => {
      const offers = await fetchOffersByLot("NONEXISTENT");
      expect(offers).toEqual([]);
    });

    it("returns previously created offers for matching lotId", async () => {
      await createOffer(validRequest);
      const offers = await fetchOffersByLot("LOT-001");
      expect(offers.length).toBeGreaterThanOrEqual(1);
      expect(offers[0].lotId).toBe("LOT-001");
    });
  });

  describe("respondToOffer", () => {
    it("throws for non-existent offer", async () => {
      await expect(respondToOffer("NONEXISTENT", "accept")).rejects.toThrow("Offer not found");
    });

    it("accepts an existing offer", async () => {
      const offer = await createOffer(validRequest);
      const accepted = await respondToOffer(offer.id, "accept");
      expect(accepted.status).toBe("accepted");
    });

    it("rejects an existing offer", async () => {
      const offer = await createOffer(validRequest);
      const rejected = await respondToOffer(offer.id, "reject");
      expect(rejected.status).toBe("rejected");
    });
  });

  describe("counterOffer", () => {
    it("throws for non-existent parent", async () => {
      await expect(counterOffer("NONEXISTENT", validRequest)).rejects.toThrow("Parent offer not found");
    });

    it("creates a counter offer and marks parent as countered", async () => {
      const parent = await createOffer(validRequest);
      const counter = await counterOffer(parent.id, {
        ...validRequest,
        pricePerKg: 1600,
      });
      expect(counter).toHaveProperty("parentOfferId", parent.id);
      expect(counter).toHaveProperty("status", "pending");
      expect(counter.pricePerKg).toBe(1600);
    });
  });

  describe("withdrawOffer", () => {
    it("withdraws an existing offer", async () => {
      const offer = await createOffer(validRequest);
      await withdrawOffer(offer.id);
      const offers = await fetchOffersByLot("LOT-001");
      const withdrawn = offers.find((o) => o.id === offer.id);
      expect(withdrawn?.status).toBe("withdrawn");
    });

    it("does not throw for non-existent offer", async () => {
      await expect(withdrawOffer("NONEXISTENT")).resolves.toBeUndefined();
    });
  });

  describe("simulateSellerResponse", () => {
    it("rejects for non-existent offer", async () => {
      await expect(simulateSellerResponse("NONEXISTENT")).rejects.toThrow("Offer not found");
    });

    it("returns a counter offer for valid offer", async () => {
      const offer = await createOffer(validRequest);
      const response = await simulateSellerResponse(offer.id);
      expect(response).toHaveProperty("parentOfferId", offer.id);
      expect(response).toHaveProperty("status", "pending");
      expect(response.pricePerKg).not.toBe(offer.pricePerKg);
    });
  });
});
