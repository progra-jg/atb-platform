import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import ScanPage from "../ScanPage";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

const mockGetUserMedia = vi.fn();
const mockPermissionsQuery = vi.fn(() => Promise.resolve({ state: "prompt", addEventListener: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    configurable: true,
  });
  Object.defineProperty(navigator, "permissions", {
    value: { query: mockPermissionsQuery },
    configurable: true,
  });
});

describe("ScanPage", () => {
  it("renders the title and instructions", () => {
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    expect(screen.getByText(/scanner qr|scan qr/i)).toBeInTheDocument();
    expect(screen.getByText(/scannez le qr|scan a lot/i)).toBeInTheDocument();
  });

  it("shows start button when idle", () => {
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    expect(screen.getByText(/activer la caméra|enable camera/i)).toBeInTheDocument();
  });

  it("shows manual entry toggle", () => {
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    expect(screen.getByText(/saisir manuellement|enter lot id/i)).toBeInTheDocument();
  });

  it("opens manual input when clicked", () => {
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText(/saisir manuellement|enter lot id/i));
    const input = screen.getByPlaceholderText(/ATB-/);
    expect(input).toBeInTheDocument();
  });

  it("shows disabled button when permission is denied", async () => {
    mockPermissionsQuery.mockResolvedValue({ state: "denied", addEventListener: vi.fn() });
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    const btn = await screen.findByText(/accès à la caméra refusé|camera access denied/i);
    expect(btn).toBeDisabled();
  });

  it("disables start button when getUserMedia is missing", () => {
    const origMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    });
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    const btn = screen.getByText(/activer la caméra|enable camera/i);
    expect(btn).toBeDisabled();
    Object.defineProperty(navigator, "mediaDevices", {
      value: origMediaDevices,
      configurable: true,
    });
  });

  it("calls getUserMedia when start button is clicked", () => {
    const { container } = render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toMatch(/Activer|Enable/);
    fireEvent.click(btn!);
    expect(mockGetUserMedia).toHaveBeenCalled();
  });

  it("manual input navigates to lot on submit", () => {
    render(
      <TestWrapper>
        <ScanPage />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText(/saisir manuellement|enter lot id/i));
    const input = screen.getByPlaceholderText(/ATB-/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "ATB-2403-001" } });
    fireEvent.click(screen.getByText("GO"));
    expect(window.location.pathname).toContain("ATB-2403-001");
  });
});
