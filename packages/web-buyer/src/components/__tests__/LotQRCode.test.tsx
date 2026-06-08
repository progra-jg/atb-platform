import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "../../test/providers";
import LotQRCode from "../LotQRCode";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,mocked")),
  },
}));

describe("LotQRCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    });
  });

  it("renders the lot ID", () => {
    render(
      <TestWrapper>
        <LotQRCode lotId="ATB-2403-001" lotUrl="https://example.com/lots/ATB-2403-001" />
      </TestWrapper>
    );
    expect(screen.getByText("ATB-2403-001")).toBeInTheDocument();
  });

  it("shows QR image after generation", async () => {
    render(
      <TestWrapper>
        <LotQRCode lotId="ATB-2403-001" lotUrl="https://example.com/lots/ATB-2403-001" />
      </TestWrapper>
    );
    await waitFor(() => {
      const img = screen.getByAltText(/QR code pour le lot/i);
      expect(img).toBeInTheDocument();
    });
  });

  it("shows skeleton while generating", () => {
    render(
      <TestWrapper>
        <LotQRCode lotId="ATB-2403-001" lotUrl="https://example.com/lots/ATB-2403-001" />
      </TestWrapper>
    );
    const skeleton = document.querySelector("[style*='shimmer']");
    expect(skeleton).toBeInTheDocument();
  });

  it("has download button", async () => {
    render(
      <TestWrapper>
        <LotQRCode lotId="ATB-2403-001" lotUrl="https://example.com/lots/ATB-2403-001" />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/download/i)).toBeInTheDocument();
    });
  });
});
