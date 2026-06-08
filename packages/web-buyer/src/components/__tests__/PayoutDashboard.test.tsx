import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../../context/ThemeContext";
import i18n from "../../i18n";
import PayoutDashboard from "../PayoutDashboard";
import * as payoutService from "../../services/payout";
import type { PayoutRecord, PayoutStats } from "../../types/payout";

const mockPayouts: PayoutRecord[] = [
  { id: "po_1", paymentId: "pay_1", orderId: "ord_1", producteurId: "prod_1", amount: 50000, currency: "XOF", method: "mobile_money", provider: "mtn_momo", phone: "+22961000001", status: "completed", createdAt: "2025-05-01T10:00:00Z", updatedAt: "2025-05-01T10:05:00Z", completedAt: "2025-05-01T10:05:00Z" },
  { id: "po_2", paymentId: "pay_2", orderId: "ord_2", producteurId: "prod_1", amount: 25000, currency: "XOF", method: "mobile_money", provider: "moov_flooz", phone: "+22961000002", status: "pending", createdAt: "2025-05-02T08:00:00Z", updatedAt: "2025-05-02T08:00:00Z" },
  { id: "po_3", paymentId: "pay_3", orderId: "ord_3", producteurId: "prod_1", amount: 10000, currency: "XOF", method: "mobile_money", provider: "orange_money", phone: "+22961000003", status: "failed", createdAt: "2025-05-03T12:00:00Z", updatedAt: "2025-05-03T12:03:00Z", failureReason: "Insufficient balance" },
];

const mockStats: PayoutStats = {
  totalDisbursed: 75000, totalTransactions: 3, successRate: 33.33,
  byProvider: [{ provider: "mtn_momo", count: 1, volume: 50000 }],
  today: { count: 0, volume: 0 }, pendingCount: 1,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nextProvider>
  );
}

vi.mock("../../services/payout", () => ({
  fetchPayouts: vi.fn(),
  fetchPayoutStats: vi.fn(),
  initiatePayout: vi.fn(),
}));

const mockedPayout = vi.mocked(payoutService);

describe("PayoutDashboard", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
    vi.clearAllMocks();
    mockedPayout.fetchPayouts.mockResolvedValue(mockPayouts);
    mockedPayout.fetchPayoutStats.mockResolvedValue(mockStats);
    mockedPayout.initiatePayout.mockResolvedValue({ id: "po_new" });
  });

  it("affiche le chargement initial", () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("affiche les statistiques après chargement", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("75 000 XOF")).toBeInTheDocument());
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("33.33%")).toBeInTheDocument();
  });

  it("affiche la liste des paiements", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("50 000 XOF")).toBeInTheDocument());
    expect(screen.getByText("25 000 XOF")).toBeInTheDocument();
    expect(screen.getByText("10 000 XOF")).toBeInTheDocument();
    expect(screen.getByText("mtn_momo")).toBeInTheDocument();
    expect(screen.getByText("moov_flooz")).toBeInTheDocument();
    expect(screen.getByText("orange_money")).toBeInTheDocument();
  });

  it("affiche les badges de statut", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => {
      expect(screen.getAllByText(/Envoyé|En attente|Échec/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("affiche l'état vide", async () => {
    mockedPayout.fetchPayouts.mockResolvedValue([]);
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => {
      expect(screen.getByText(/pas encore reçu de paiement/i)).toBeInTheDocument();
    });
  });

  it("ouvre et ferme le formulaire", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Recevoir le paiement")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Recevoir le paiement"));
    await waitFor(() => expect(screen.getByPlaceholderText("50000")).toBeInTheDocument());
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("soumet le formulaire et recharge", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Recevoir le paiement")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Recevoir le paiement"));
    await waitFor(() => expect(screen.getByPlaceholderText("50000")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("50000"), "30000");
    await userEvent.type(screen.getByPlaceholderText("+229 XX XX XX XX"), "+22961000099");
    fireEvent.click(screen.getByText("Confirmer le retrait"));
    await waitFor(() => {
      expect(mockedPayout.initiatePayout).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 30000, phone: "+22961000099", provider: "mtn_momo" })
      );
    });
  });

  it("affiche une erreur de soumission", async () => {
    mockedPayout.initiatePayout.mockRejectedValue(new Error("Fonds insuffisants"));
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Recevoir le paiement")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Recevoir le paiement"));
    await waitFor(() => expect(screen.getByPlaceholderText("50000")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("50000"), "100");
    await userEvent.type(screen.getByPlaceholderText("+229 XX XX XX XX"), "+22961000099");
    fireEvent.click(screen.getByText("Confirmer le retrait"));
    await waitFor(() => expect(screen.getByText("Fonds insuffisants")).toBeInTheDocument());
  });

  it("gère l'échec de chargement", async () => {
    mockedPayout.fetchPayouts.mockRejectedValue(new Error("Network error"));
    mockedPayout.fetchPayoutStats.mockRejectedValue(new Error("Network error"));
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Recevoir le paiement")).toBeInTheDocument());
  });

  it("change le provider", async () => {
    render(<Wrapper><PayoutDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Recevoir le paiement")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Recevoir le paiement"));
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "orange_money" } });
    expect(screen.getByRole("combobox")).toHaveValue("orange_money");
  });
});
