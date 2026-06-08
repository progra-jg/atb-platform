import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, MemoryRouter, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../context/ThemeContext";
import { ToastProvider } from "../../context/ToastContext";
import i18n from "../../i18n";
import BuyerLayout from "../BuyerLayout";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-buyer-1",
      email: "buyer@test.com",
      company: "BuyCorp",
      country: "BJ",
      role: "user",
      metadata: { onboarding: { userType: "active_buyer", completed: true } },
    },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

function LayoutWrapper({ initialRoute = "/business" }: { initialRoute?: string }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route path="/business" element={<BuyerLayout />}>
                  <Route index element={<div>Buyer Dashboard</div>} />
                  <Route path="marketplace" element={<div>Marketplace</div>} />
                  <Route path="marketplace/lot/1" element={<div>Lot Detail</div>} />
                </Route>
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("BuyerLayout", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  it("renders sidebar with nav items", () => {
    render(<LayoutWrapper />);
    const sidebarItems = [
      "Tableau de bord", "Commandes", "Contrats",
      "Favoris", "Messages", "Paramètres",
    ];
    for (const item of sidebarItems) {
      expect(screen.getAllByText(item).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders child route content", () => {
    render(<LayoutWrapper />);
    expect(screen.getByText("Buyer Dashboard")).toBeInTheDocument();
  });

  it("renders nested route", () => {
    render(<LayoutWrapper initialRoute="/business/marketplace" />);
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("shows breadcrumbs for nested routes", () => {
    render(<LayoutWrapper initialRoute="/business/marketplace/lot/1" />);
    expect(screen.getAllByText("Détail").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tableau de bord").length).toBeGreaterThanOrEqual(1);
  });

  it("renders buyer badge", () => {
    render(<LayoutWrapper />);
    expect(
      screen.getByText((content) => content.includes("Acheteur"))
    ).toBeInTheDocument();
  });
});