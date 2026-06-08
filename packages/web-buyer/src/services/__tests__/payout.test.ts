import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initiatePayout, fetchPayouts, fetchPayoutStats, checkPayoutStatus } from "../payout";
import type { PayoutRecord, PayoutStats } from "../../types/payout";

const BASE = "http://localhost:4000/api";

function mockFetchOnce(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("payout service", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("initiatePayout", () => {
    const params = {
      paymentId: "pay_1",
      orderId: "ord_1",
      producteurId: "prod_1",
      amount: 150000,
      method: "mobile_money" as const,
      provider: "mtn_momo" as const,
      phone: "+22961010101",
      currency: "XOF",
    };

    it("sends POST to /payout/initiate and returns data", async () => {
      const expected: PayoutRecord = {
        id: "po_api_1", paymentId: "pay_1", orderId: "ord_1",
        producteurId: "prod_1", amount: 150000, currency: "XOF",
        method: "mobile_money", provider: "mtn_momo",
        phone: "+22961010101", status: "completed",
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const fetchMock = vi.fn().mockResolvedValue(
        mockFetchOnce({ success: true, data: expected }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await initiatePayout(params);
      expect(result).toEqual(expected);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/payout/initiate`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(params),
        }),
      );
    });

    it("uses default currency XOF when not provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        mockFetchOnce({ success: true, data: { id: "po_1", currency: "XOF" } }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { currency: _, ...rest } = params;
      await initiatePayout(rest);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to synthetic record on network error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

      const promise = initiatePayout(params);
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;
      expect(result.status).toBe("completed");
      expect(result.paymentId).toBe("pay_1");
      expect(result.amount).toBe(150000);
      expect(result.currency).toBe("XOF");
      expect(result.id).toMatch(/^po_/);
    });

    it("falls back on HTTP error status", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response("Server Error", { status: 500 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const promise = initiatePayout(params);
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;
      expect(result.status).toBe("completed");
    });

    it("retries on network failure then succeeds", async () => {
      const expected: PayoutRecord = {
        id: "po_retry", paymentId: "pay_1", orderId: "ord_1",
        producteurId: "prod_1", amount: 150000, currency: "XOF",
        method: "mobile_money", provider: "mtn_momo",
        phone: "+22961010101", status: "completed",
        completedAt: "", createdAt: "", updatedAt: "",
      };
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(mockFetchOnce({ success: true, data: expected }));
      vi.stubGlobal("fetch", fetchMock);

      const promise = initiatePayout(params);
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;

      expect(result).toEqual(expected);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("fetchPayouts", () => {
    it("sends GET to /payouts and returns data", async () => {
      const records: PayoutRecord[] = [
        { id: "po_1", paymentId: "pay_1", orderId: "ord_1", producteurId: "prod_1", amount: 150000, currency: "XOF", method: "mobile_money", provider: "mtn_momo", phone: "+22961010101", status: "completed", completedAt: "", createdAt: "", updatedAt: "" },
      ];
      const fetchMock = vi.fn().mockResolvedValue(
        mockFetchOnce({ success: true, data: records }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchPayouts();
      expect(result).toEqual(records);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/payouts`, expect.any(Object));
    });

    it("appends query params for producteurId and status", async () => {
      const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce({ success: true, data: [] }));
      vi.stubGlobal("fetch", fetchMock);

      await fetchPayouts({ producteurId: "prod_1", status: "completed" });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/payouts?producteurId=prod_1&status=completed`,
        expect.any(Object),
      );
    });

    it("omits query string when no filter", async () => {
      const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce({ success: true, data: [] }));
      vi.stubGlobal("fetch", fetchMock);

      await fetchPayouts({});
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/payouts`, expect.any(Object));
    });

    it("falls back to MOCK_PAYOUTS on error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

      const promise = fetchPayouts();
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toHaveProperty("id");
    });
  });

  describe("fetchPayoutStats", () => {
    it("sends GET to /payout/stats", async () => {
      const stats: PayoutStats = { totalDisbursed: 100000, totalTransactions: 1, successRate: 100, byProvider: [], today: { count: 0, volume: 0 }, pendingCount: 0 };
      const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce({ success: true, data: stats }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchPayoutStats();
      expect(result).toEqual(stats);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/payout/stats`, expect.any(Object));
    });

    it("appends producteurId query param", async () => {
      const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce({ success: true, data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await fetchPayoutStats("prod_1");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/payout/stats?producteurId=prod_1`,
        expect.any(Object),
      );
    });

    it("falls back to MOCK_STATS on error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

      const promise = fetchPayoutStats();
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;
      expect(result.totalDisbursed).toBe(400000);
      expect(result.byProvider).toHaveLength(2);
    });
  });

  describe("checkPayoutStatus", () => {
    it("sends POST to /payout/{id}/check-status", async () => {
      const record: PayoutRecord = { id: "po_1", paymentId: "pay_1", orderId: "ord_1", producteurId: "prod_1", amount: 150000, currency: "XOF", method: "mobile_money", provider: "mtn_momo", phone: "+22961010101", status: "completed", completedAt: "", createdAt: "", updatedAt: "" };
      const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce({ success: true, data: record }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await checkPayoutStatus("po_1");
      expect(result).toEqual(record);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/payout/po_1/check-status`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("falls back to processing record on error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

      const promise = checkPayoutStatus("po_unknown");
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;
      expect(result.id).toBe("po_unknown");
      expect(result.status).toBe("processing");
    });

    it("retries before falling back", async () => {
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error("timeout"))
        .mockRejectedValueOnce(new Error("timeout"))
        .mockRejectedValueOnce(new Error("timeout"));
      vi.stubGlobal("fetch", fetchMock);

      const promise = checkPayoutStatus("po_retry");
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await promise;

      expect(result.status).toBe("processing");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
