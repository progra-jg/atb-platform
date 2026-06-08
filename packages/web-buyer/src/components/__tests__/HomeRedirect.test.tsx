import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../context/ThemeContext";
import { ToastProvider } from "../../context/ToastContext";
import i18n from "../../i18n";
import HomeRedirect from "../HomeRedirect";
import { clearRoleLock } from "../../services/roleLock";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useAuth } from "../../context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

function AuthWrapper({ initialRoute = "/" }: { initialRoute?: string }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ThemeProvider>
            <ToastProvider>
              <HelmetProvider>
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/producer" element={<div data-testid="producer-route">Producer Hub</div>} />
                  <Route path="/dashboard" element={<div data-testid="dashboard-route">Dashboard</div>} />
                </Routes>
              </HelmetProvider>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

function mockUser(userType: string | null, completed = true) {
  if (!userType) {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
    });
    return;
  }
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: {
      id: "u-test-1",
      email: "test@example.com",
      company: "Test Co",
      country: "BJ",
      role: "user",
      metadata: {
        onboarding: { userType, completed },
      },
    },
    loading: false,
  });
}

describe("HomeRedirect", () => {
  beforeEach(() => {
    clearRoleLock();
  });

  it("shows landing page when no user", { timeout: 15000 }, () => {
    mockUser(null);
    render(<AuthWrapper />);
    expect(screen.getAllByText(/ATB|AgriTech|Bénin|market|agricole/i).length).toBeGreaterThanOrEqual(1);
  });

  it("redirects farmers to /producer", () => {
    mockUser("farmer");
    render(<AuthWrapper />);
    expect(screen.getByTestId("producer-route")).toBeInTheDocument();
    expect(screen.getByText("Producer Hub")).toBeInTheDocument();
  });

  it("redirects active buyers to /dashboard", () => {
    mockUser("active_buyer");
    render(<AuthWrapper />);
    expect(screen.getByTestId("dashboard-route")).toBeInTheDocument();
  });

  it("redirects potential buyers to /dashboard", () => {
    mockUser("potential_buyer");
    render(<AuthWrapper />);
    expect(screen.getByTestId("dashboard-route")).toBeInTheDocument();
  });

  it("shows nothing while loading", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: true,
    });
    const { container } = render(<AuthWrapper />);
    expect(container.textContent?.trim() || "").toBe("");
  });
});
