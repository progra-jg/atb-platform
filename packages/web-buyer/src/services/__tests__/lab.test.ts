import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchLabReport } from "../lab";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

describe("lab service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchLabReport", () => {
    it("returns the cacao report for ATB-2403-001", async () => {
      const report = await fetchLabReport("ATB-2403-001", "Cacao");
      expect(report).not.toBeNull();
      expect(report!.culture).toBe("Cacao");
      expect(report!.overallGrade).toBe("excellent");
      expect(report!.overallScore).toBe(94);
      expect(report!.laboratory).toContain("SGS");
    });

    it("returns the cotton report for ATB-2403-002", async () => {
      const report = await fetchLabReport("ATB-2403-002", "Coton");
      expect(report).not.toBeNull();
      expect(report!.culture).toBe("Coton");
      expect(report!.overallGrade).toBe("good");
      expect(report!.overallScore).toBe(84);
    });

    it("returns the cashew report for ATB-2403-005", async () => {
      const report = await fetchLabReport("ATB-2403-005", "Anacarde");
      expect(report).not.toBeNull();
      expect(report!.culture).toBe("Anacarde");
      expect(report!.overallGrade).toBe("standard");
      expect(report!.overallScore).toBe(72);
      expect(report!.pdfAvailable).toBe(false);
    });

    it("returns generic report for unknown lot", async () => {
      const report = await fetchLabReport("UNKNOWN-LOT", "Maïs");
      expect(report).not.toBeNull();
      expect(report!.lotId).toBe("UNKNOWN-LOT");
      expect(report!.culture).toBe("Maïs");
      expect(report!.overallScore).toBe(70);
    });

    it("caches report on second call", async () => {
      const first = await fetchLabReport("ATB-2403-001", "Cacao");
      const second = await fetchLabReport("ATB-2403-001", "Cacao");
      expect(second!.reportId).toBe(first!.reportId);
    });

    it("has correct parameter structure for cacao", async () => {
      const report = await fetchLabReport("ATB-2403-001", "Cacao");
      expect(report!.parameters).toHaveLength(8);
      report!.parameters.forEach((p) => {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("nameKey");
        expect(p).toHaveProperty("value");
        expect(p).toHaveProperty("standard");
        expect(p).toHaveProperty("unit");
        expect(p).toHaveProperty("status");
        expect(p).toHaveProperty("score");
      });
    });

    it("includes parameters with warning/fail status for standard grade", async () => {
      const report = await fetchLabReport("ATB-2403-005", "Anacarde");
      const warnings = report!.parameters.filter((p) => p.status === "warning");
      const fails = report!.parameters.filter((p) => p.status === "fail");
      expect(warnings.length).toBeGreaterThanOrEqual(1);
      expect(fails.length).toBeGreaterThanOrEqual(1);
    });

    it("all parameters pass for excellent grade", async () => {
      const report = await fetchLabReport("ATB-2403-001", "Cacao");
      const nonPass = report!.parameters.filter((p) => p.status !== "pass");
      expect(nonPass).toHaveLength(0);
    });

    it("uses API when available", async () => {
      const mockData = { reportId: "LAB-API-001", lotId: "API-LOT", culture: "Soja", overallGrade: "good", overallScore: 85, parameters: [], conclusionKey: "lab.conclusions.good", pdfAvailable: true, origin: "-", sampleDate: "-", reportDate: "-", laboratory: "-", analyst: "-" };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });
      const result = await fetchLabReport("API-LOT", "Soja");
      expect(result).toEqual(mockData);
    });
  });
});
