import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchShipmentByOrder, fetchShipmentStats } from "../shipments";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

describe("shipments service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchShipmentByOrder", () => {
    it("returns shipment with correct structure for in-transit status", async () => {
      const shipment = await fetchShipmentByOrder("ORD-001", "En transit", "Cacao", "LOT-001", "Cotonou", "500 kg");
      expect(shipment).toHaveProperty("orderId", "ORD-001");
      expect(shipment).toHaveProperty("lotId", "LOT-001");
      expect(shipment).toHaveProperty("culture", "Cacao");
      expect(shipment).toHaveProperty("status", "En transit");
      expect(shipment).toHaveProperty("milestones");
      expect(shipment).toHaveProperty("documents");
      expect(shipment).toHaveProperty("driver");
    });

    it("returns delivered milestones for Livrée status", async () => {
      const shipment = await fetchShipmentByOrder("ORD-002", "Livrée", "Coton", "LOT-002", "Parakou", "300 kg");
      const completed = shipment.milestones.filter((m) => m.status === "completed");
      expect(completed.length).toBe(shipment.milestones.length);
    });

    it("returns pending milestones for En attente status", async () => {
      const shipment = await fetchShipmentByOrder("ORD-003", "En attente", "Anacarde", "LOT-003", "Bohicon", "200 kg");
      const pending = shipment.milestones.filter((m) => m.status === "pending");
      expect(pending.length).toBe(shipment.milestones.length);
    });

    it("includes driver only for active transit statuses", async () => {
      const inTransit = await fetchShipmentByOrder("ORD-004", "En transit", "Cacao", "LOT-004", "Cotonou", "100 kg");
      expect(inTransit.driver).toBeDefined();
      expect(inTransit.driver).toHaveProperty("name");
      expect(inTransit.driver).toHaveProperty("phone");
    });

    it("excludes driver for pending status", async () => {
      const pending = await fetchShipmentByOrder("ORD-005", "En attente", "Cacao", "LOT-005", "Cotonou", "100 kg");
      expect(pending.driver).toBeUndefined();
    });

    it("returns shipment from cache on second call", async () => {
      const first = await fetchShipmentByOrder("ORD-CACHE", "En transit", "Cacao", "LOT-CACHE", "Cotonou", "500 kg");
      const second = await fetchShipmentByOrder("ORD-CACHE", "En transit", "Cacao", "LOT-CACHE", "Cotonou", "500 kg");
      expect(second.orderId).toBe(first.orderId);
    });

    it("uses API when available", async () => {
      const mockData = { orderId: "ORD-API-001", status: "Livrée", culture: "Cacao" };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });
      const result = await fetchShipmentByOrder("ORD-API-001", "Livrée", "Cacao", "LOT-API", "Cotonou", "500 kg");
      expect(result).toEqual(mockData);
    });
  });

  describe("fetchShipmentStats", () => {
    it("returns stats structure when API fails", async () => {
      const stats = await fetchShipmentStats();
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("inTransit");
      expect(stats).toHaveProperty("deliveredToday");
      expect(stats).toHaveProperty("avgTransitDays");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.avgTransitDays).toBe("number");
    });

    it("uses API when available", async () => {
      const mockData = { active: 5, inTransit: 3, deliveredToday: 2, avgTransitDays: 3.5 };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });
      const stats = await fetchShipmentStats();
      expect(stats).toEqual(mockData);
    });
  });
});
