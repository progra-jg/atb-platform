import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "../../test/providers";
import { NegotiationTrigger } from "../NegotiationPanel";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

describe("NegotiationTrigger", () => {
  it("renders the make offer button", () => {
    render(
      <TestWrapper>
        <NegotiationTrigger
          lotId="LOT-NEG-001"
          sellerId="seller-1"
          culture="Cacao"
          lotQuantity="500 kg"
          lotPrice={1500}
          lotOrigin="Parakou"
        />
      </TestWrapper>
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toBeTruthy();
  });

  it("opens negotiation dialog on click", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <NegotiationTrigger
          lotId="LOT-NEG-002"
          sellerId="seller-2"
          culture="Coton"
          lotQuantity="300 kg"
          lotPrice={1200}
          lotOrigin="Bohicon"
        />
      </TestWrapper>
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText(/n.gociation|negotiation/i)).toBeInTheDocument();
  });
});
