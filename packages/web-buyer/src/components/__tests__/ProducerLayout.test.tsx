import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, MemoryRouter, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../context/ThemeContext";
import { ToastProvider } from "../../context/ToastContext";
import i18n from "../../i18n";
import ProducerLayout from "../ProducerLayout";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-farmer-1",
      email: "farmer@test.com",
      company: "Ferme Test",
      country: "BJ",
      role: "user",
      metadata: { onboarding: { userType: "farmer", completed: true } },
    },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../services/orders", () => ({
  fetchOrders: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../services/farmerLots", () => ({
  getAllFarmerLots: vi.fn(() => []),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

function LayoutWrapper({ initialRoute = "/producer" }: { initialRoute?: string }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route path="/producer" element={<ProducerLayout />}>
                  <Route index element={<div>Producer Dashboard</div>} />
                  <Route path="lots" element={<div>Lots Page</div>} />
                  <Route path="lots/new" element={<div>New Lot</div>} />
                </Route>
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("ProducerLayout", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  it("renders sidebar with nav items", () => {
    render(<LayoutWrapper />);
    const sidebarItems = [
      "Tableau de bord", "Mes lots", "Commandes reçues",
      "Contrats-cadre", "Analytiques", "Paramètres",
    ];
    for (const item of sidebarItems) {
      expect(screen.getAllByText(item).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders child route content", () => {
    render(<LayoutWrapper />);
    expect(screen.getByText("Producer Dashboard")).toBeInTheDocument();
  });

  it("renders nested route", () => {
    render(<LayoutWrapper initialRoute="/producer/lots" />);
    expect(screen.getByText("Lots Page")).toBeInTheDocument();
  });

  it("shows breadcrumbs on deep routes", () => {
    render(<LayoutWrapper initialRoute="/producer/lots/new" />);
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
    expect(screen.getAllByText("Mes lots").length).toBeGreaterThanOrEqual(1);
  });
});
