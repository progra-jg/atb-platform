import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../../context/ThemeContext";
import i18n from "../../i18n";
import ConnectionStatus from "../ConnectionStatus";
import { start, stop } from "../../services/networkMonitor";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe("ConnectionStatus", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.useFakeTimers();
    start();
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders nothing when online", () => {
    const { container } = render(<Wrapper><ConnectionStatus /></Wrapper>);
    expect(container.textContent).toBe("");
  });

  it("shows offline message when window goes offline", () => {
    render(<Wrapper><ConnectionStatus /></Wrapper>);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(screen.getByText(/hors ligne/i)).toBeInTheDocument();
  });

  it("shows retry button when offline", () => {
    render(<Wrapper><ConnectionStatus /></Wrapper>);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(screen.getByText(/réessayer/i)).toBeInTheDocument();
  });
});
