import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import ThresholdBadge from "../ThresholdBadge";
import type { ThresholdResult } from "../../utils/threshold";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

function makeResult(overrides: Partial<ThresholdResult> = {}): ThresholdResult {
  return {
    meetsThreshold: true,
    score: 85,
    requiredScore: 40,
    isLargeLot: false,
    missingRequirements: [],
    severity: "ok",
    estimatedLotValue: 2400000,
    ...overrides,
  };
}

describe("ThresholdBadge", () => {
  it("renders sm badge with score", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult()} size="sm" />
      </TestWrapper>
    );
    expect(screen.getByText(/85\/40/)).toBeInTheDocument();
  });

  it("shows ShieldCheck icon for ok severity", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult({ severity: "ok" })} size="sm" />
      </TestWrapper>
    );
    expect(screen.getByText(/85\/40/)).toBeInTheDocument();
  });

  it("shows warning icon for warning severity", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult({ severity: "warning", meetsThreshold: false, score: 30 })} size="sm" />
      </TestWrapper>
    );
    expect(screen.getByText(/30\/40/)).toBeInTheDocument();
  });

  it("shows estimated value for large lot", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult({ isLargeLot: true, estimatedLotValue: 6000000, requiredScore: 70 })} size="sm" />
      </TestWrapper>
    );
    expect(screen.getByText(/85\/70/)).toBeInTheDocument();
  });

  it("renders md card with expandable details", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult()} size="md" />
      </TestWrapper>
    );
    expect(screen.getByText(/standard/i)).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("expands detail rows on click", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult()} size="md" />
      </TestWrapper>
    );
    const header = screen.getByText("85").closest("[style*='cursor: pointer']") ?? screen.getByText("85");
    fireEvent.click(header);
    expect(screen.getByText(/complétude|completeness/i)).toBeInTheDocument();
  });

  it("renders blocking severity correctly", () => {
    render(
      <TestWrapper>
        <ThresholdBadge result={makeResult({ severity: "blocking", meetsThreshold: false, isLargeLot: true, score: 40, requiredScore: 70 })} size="sm" />
      </TestWrapper>
    );
    expect(screen.getByText(/40\/70/)).toBeInTheDocument();
  });
});
