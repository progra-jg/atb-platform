import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../../context/ThemeContext";
import i18n from "../../i18n";
import FinancingDashboard from "../FinancingDashboard";
import * as financingService from "../../services/financing";
import type { FinancingEligibility, FinancingContract } from "../../types/financing";

const mockEligibility: FinancingEligibility = {
  eligible: true,
  score: 650,
  minRequired: 550,
  maxAmount: 500000,
  availableOffers: [
    { id: "offer_1", inputType: "seeds_maize", label: "Semences maïs", maxAmount: 200000, interestRate: 5, durationDays: 180, minTrustScore: 550, collateralRequired: ["harvest"], active: true },
    { id: "offer_2", inputType: "fertilizer", label: "Engrais NPK", maxAmount: 150000, interestRate: 4, durationDays: 120, minTrustScore: 600, collateralRequired: ["harvest"], active: true },
  ],
  reason: undefined,
  activeContracts: 1,
  totalOutstanding: 100000,
  repaymentRate: 75,
};

const mockContracts: FinancingContract[] = [
  {
    id: "ctr_1", producteurId: "prod_1", offerId: "offer_1", amount: 100000, interestRate: 5,
    totalRepayable: 105000, status: "active", collateralType: "harvest", collateralRef: "champ_01",
    disbursedAt: "2025-03-01T08:00:00Z", dueDate: "2025-09-01T08:00:00Z",
    schedule: [
      { dueDate: "2025-04-01T08:00:00Z", amount: 26250, status: "paid", paidAt: "2025-04-01T08:00:00Z" },
      { dueDate: "2025-05-01T08:00:00Z", amount: 26250, status: "paid", paidAt: "2025-05-01T08:00:00Z" },
      { dueDate: "2025-06-01T08:00:00Z", amount: 26250, status: "pending" },
      { dueDate: "2025-07-01T08:00:00Z", amount: 26250, status: "pending" },
    ],
    createdAt: "2025-03-01T08:00:00Z", updatedAt: "2025-05-01T08:00:00Z",
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nextProvider>
  );
}

vi.mock("../../services/financing", () => ({
  checkEligibility: vi.fn(),
  applyForFinancing: vi.fn(),
  getActiveContracts: vi.fn(),
  repayContract: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "prod_1", email: "test@test.com", company: "Test", country: "BJ", role: "producteur" }, token: "tok_1", loading: false }),
}));

vi.mock("../../hooks/useTrustScore", () => ({
  useTrustScore: () => ({ data: { overall: 65, tier: "gold", labelKey: "trustBadge.tier.gold", components: { transactionSuccessRate: 80, credibilityScore: 70, trustIndexScore: 60, dataCompleteness: 50, didVerified: 0, eudrCompliance: 0 } }, isLoading: false, isError: false }),
}));

const mockedFinancing = vi.mocked(financingService);

describe("FinancingDashboard", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
    vi.clearAllMocks();
    mockedFinancing.checkEligibility.mockResolvedValue(mockEligibility);
    mockedFinancing.getActiveContracts.mockResolvedValue(mockContracts);
    mockedFinancing.applyForFinancing.mockResolvedValue({ id: "ctr_new" });
    mockedFinancing.repayContract.mockResolvedValue({ success: true });
  });

  it("affiche le chargement initial", () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("affiche les statistiques d'éligibilité", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Oui")).toBeInTheDocument());
    expect(screen.getByText("500 000 XOF")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("affiche les offres disponibles pour un éligible", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    expect(screen.getByText("Engrais NPK")).toBeInTheDocument();
    expect(screen.getByText("200 000")).toBeInTheDocument();
    expect(screen.getByText("150 000")).toBeInTheDocument();
  });

  it("affiche les contrats actifs", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("100 000 XOF")).toBeInTheDocument());
    expect(screen.getByText(/105 000 XOF/)).toBeInTheDocument();
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("affiche le message pour non-éligible", async () => {
    mockedFinancing.checkEligibility.mockResolvedValue({
      ...mockEligibility, eligible: false, reason: "Score insuffisant",
    });
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Score insuffisant")).toBeInTheDocument());
    expect(screen.getByText("Non")).toBeInTheDocument();
  });

  it("cliquer sur une offre montre le formulaire", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Semences maïs"));
    await waitFor(() => expect(screen.getByText(/Demande de financement/)).toBeInTheDocument());
  });

  it("soumet une demande de financement", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Semences maïs"));
    await waitFor(() => expect(screen.getByPlaceholderText(/Max.*200 000/)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/Max.*200 000/), "50000");
    fireEvent.click(screen.getByText("Demander le financement"));
    await waitFor(() => {
      expect(mockedFinancing.applyForFinancing).toHaveBeenCalledWith(
        "prod_1", 650, "offer_1", 50000, "harvest", undefined
      );
    });
  });

  it("affiche un message de succès après demande", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Semences maïs"));
    await waitFor(() => expect(screen.getByPlaceholderText(/Max.*200 000/)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/Max.*200 000/), "30000");
    fireEvent.click(screen.getByText("Demander le financement"));
    await waitFor(() => expect(screen.getByText(/Financement approuvé/)).toBeInTheDocument());
  });

  it("affiche une erreur quand la demande échoue", async () => {
    mockedFinancing.applyForFinancing.mockRejectedValue(new Error("Erreur serveur"));
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Semences maïs"));
    await waitFor(() => expect(screen.getByPlaceholderText(/Max.*200 000/)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/Max.*200 000/), "10000");
    fireEvent.click(screen.getByText("Demander le financement"));
    await waitFor(() => expect(screen.getByText("Erreur")).toBeInTheDocument());
  });

  it("rembourse un contrat actif", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Rembourser")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Rembourser"));
    await waitFor(() => {
      expect(mockedFinancing.repayContract).toHaveBeenCalledWith(
        "ctr_1", 0, expect.stringMatching(/^repay_/)
      );
    });
  });

  it("gère l'absence de contrats actifs", async () => {
    mockedFinancing.getActiveContracts.mockResolvedValue([]);
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/aucun contrat/i)).toBeInTheDocument());
  });

  it("gère l'absence d'offres disponibles pour les éligibles", async () => {
    mockedFinancing.checkEligibility.mockResolvedValue({
      ...mockEligibility, availableOffers: [],
    });
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Oui")).toBeInTheDocument());
  });

  it("gère l'erreur de chargement", async () => {
    mockedFinancing.checkEligibility.mockRejectedValue(new Error("Network error"));
    mockedFinancing.getActiveContracts.mockRejectedValue(new Error("Network error"));
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => {
      expect(screen.getByText("Erreur")).toBeInTheDocument();
    });
  });

  it("soumet avec une référence de garantie", async () => {
    render(<Wrapper><FinancingDashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Semences maïs")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Semences maïs"));
    await waitFor(() => expect(screen.getByPlaceholderText(/Max.*200 000/)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/Max.*200 000/), "75000");
    await userEvent.type(screen.getByPlaceholderText(/parcelle|garant/), "tit_123");
    fireEvent.click(screen.getByText("Demander le financement"));
    await waitFor(() => {
      expect(mockedFinancing.applyForFinancing).toHaveBeenCalledWith(
        "prod_1", 650, "offer_1", 75000, "harvest", "tit_123"
      );
    });
  });
});
