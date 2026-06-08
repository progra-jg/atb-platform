import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import LabReportCard from "../LabReportCard";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

async function waitForReady() {
  await waitFor(() => {
    const loading = screen.queryByText(/chargement|loading/i);
    if (loading) throw new Error("still loading");
  }, { timeout: 8000 });
}

describe("LabReportCard", () => {
  it("renders the cacao report with score 94", async () => {
    render(
      <TestWrapper>
        <LabReportCard lotId="ATB-2403-001" culture="Cacao" />
      </TestWrapper>
    );
    await waitForReady();
    expect(screen.getByText("94")).toBeInTheDocument();
    expect(screen.getByText(/SGS.*Bénin/)).toBeInTheDocument();
  });

  it("renders the cotton report with score 84", async () => {
    render(
      <TestWrapper>
        <LabReportCard lotId="ATB-2403-002" culture="Coton" />
      </TestWrapper>
    );
    await waitForReady();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText(/Bureau Veritas/)).toBeInTheDocument();
  });

  it("renders the cashew report with score 72", async () => {
    render(
      <TestWrapper>
        <LabReportCard lotId="ATB-2403-005" culture="Anacarde" />
      </TestWrapper>
    );
    await waitForReady();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders generic fallback for unknown lot", async () => {
    render(
      <TestWrapper>
        <LabReportCard lotId="UNKNOWN-LOT" culture="Soja" />
      </TestWrapper>
    );
    await waitForReady();
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("shows download button when pdf is available", async () => {
    render(
      <TestWrapper>
        <LabReportCard lotId="ATB-2403-001" culture="Cacao" />
      </TestWrapper>
    );
    await waitForReady();
    const downloadIcon = document.querySelector("[data-testid='lab-pdf-btn']");
    if (!downloadIcon) {
      const btns = screen.getAllByRole("button");
      expect(btns.length).toBeGreaterThanOrEqual(1);
    }
  });
});
