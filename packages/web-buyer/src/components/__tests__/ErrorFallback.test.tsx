import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../../context/ThemeContext";
import i18n from "../../i18n";
import { ErrorBoundary } from "../ErrorFallback";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("💥");
  return <div>OK</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error", () => {
    render(
      <Wrapper>
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      </Wrapper>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders fallback on error", () => {
    render(
      <Wrapper>
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </Wrapper>
    );
    expect(screen.getByText(/erreur/i)).toBeInTheDocument();
  });

  it("retry button re-renders children", () => {
    const { rerender } = render(
      <Wrapper>
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </Wrapper>
    );
    rerender(
      <Wrapper>
        <ErrorBoundary>
          <Bomb shouldThrow={false} />
        </ErrorBoundary>
      </Wrapper>
    );
    fireEvent.click(screen.getByRole("button", { name: /réessayer/i }));
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("includes context label in error message", () => {
    render(
      <Wrapper>
        <ErrorBoundary context="Navbar">
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </Wrapper>
    );
    expect(screen.getByText(/Navbar/i)).toBeInTheDocument();
  });

  it("renders custom fallback instead of default", () => {
    render(
      <Wrapper>
        <ErrorBoundary fallback={<div>Custom Error UI</div>}>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </Wrapper>
    );
    expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
  });

  it("calls onError when an error is caught", () => {
    const onError = vi.fn();
    render(
      <Wrapper>
        <ErrorBoundary onError={onError}>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </Wrapper>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });
});
