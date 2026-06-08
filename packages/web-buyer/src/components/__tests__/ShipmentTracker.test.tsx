import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import { fetchShipmentByOrder } from "../../services/shipments";
import ShipmentTracker from "../ShipmentTracker";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

describe("fetchShipmentByOrder", () => {
  it("returns mock data when API fails", async () => {
    const result = await fetchShipmentByOrder("ORD-TEST-001", "En transit", "Cacao", "LOT-TEST-001", "Cotonou", "500 kg");
    expect(result).toBeDefined();
    expect(result.orderId).toBe("ORD-TEST-001");
    expect(result.status).toBe("En transit");
  });
});

describe("ShipmentTracker", () => {
  it("renders loading state initially", () => {
    render(
      <TestWrapper>
        <ShipmentTracker
          orderId="ORD-TEST-004"
          status="En transit"
          culture="Cacao"
          lotId="LOT-TEST-004"
          destination="Cotonou"
          quantity="100 kg"
        />
      </TestWrapper>
    );
    expect(screen.getByText(/chargement|loading/i)).toBeInTheDocument();
  });

  it("renders data after loading", async () => {
    render(
      <TestWrapper>
        <ShipmentTracker
          orderId="ORD-TEST-005"
          status="En transit"
          culture="Cacao"
          lotId="LOT-TEST-005"
          destination="Cotonou"
          quantity="500 kg"
        />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("500 kg")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders delivered status after loading", async () => {
    render(
      <TestWrapper>
        <ShipmentTracker
          orderId="ORD-TEST-006"
          status="Livrée"
          culture="Coton"
          lotId="LOT-TEST-006"
          destination="Parakou"
          quantity="300 kg"
        />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Parakou")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders pending status after loading", async () => {
    render(
      <TestWrapper>
        <ShipmentTracker
          orderId="ORD-TEST-007"
          status="En attente"
          culture="Anacarde"
          lotId="LOT-TEST-007"
          destination="Bohicon"
          quantity="200 kg"
        />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Bohicon")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
