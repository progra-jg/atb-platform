import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../../context/ThemeContext";
import i18n from "../../i18n";
import Breadcrumbs from "../Breadcrumbs";

function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname}</span>;
}

function SimpleWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

function WrapperWithLocation({ children, initialEntries = ["/"] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          {children}
          <LocationDisplay />
        </ThemeProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("Breadcrumbs", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  it("returns null for single crumb", () => {
    const { container } = render(
      <SimpleWrapper>
        <Breadcrumbs crumbs={[{ labelKey: "nav.dashboard" }]} />
      </SimpleWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders multiple crumbs with separator", () => {
    render(
      <SimpleWrapper>
        <Breadcrumbs crumbs={[
          { labelKey: "nav.farmerLots", path: "/producer/lots" },
          { labelKey: "nav.new" },
        ]} />
      </SimpleWrapper>
    );
    expect(screen.getByText("Mes lots")).toBeInTheDocument();
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });

  it("navigates on click when path is provided", async () => {
    const user = userEvent.setup();
    render(
      <WrapperWithLocation>
        <Breadcrumbs crumbs={[
          { labelKey: "nav.dashboard", path: "/business" },
          { labelKey: "nav.orders" },
        ]} />
      </WrapperWithLocation>
    );
    const link = screen.getByText("Tableau de bord");
    await user.click(link);
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/business");
    });
  });

  it("last item is not clickable", () => {
    render(
      <SimpleWrapper>
        <Breadcrumbs crumbs={[
          { labelKey: "nav.farmerLots", path: "/producer/lots" },
          { labelKey: "nav.new" },
        ]} />
      </SimpleWrapper>
    );
    const last = screen.getByText("Nouveau");
    expect(last.style.cursor).toBe("default");
  });
});