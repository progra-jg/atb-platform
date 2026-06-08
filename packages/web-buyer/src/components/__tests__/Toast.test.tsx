import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../../context/ToastContext";

function TestConsumer() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Succès !", "Opération réussie")}>Success</button>
      <button onClick={() => toast.error("Erreur !")}>Error</button>
      <button onClick={() => toast.warning("Attention !")}>Warning</button>
      <button onClick={() => toast.info("Info !")}>Info</button>
    </div>
  );
}

describe("ToastContext", () => {
  it("renders children", () => {
    render(
      <ToastProvider>
        <div>App</div>
      </ToastProvider>
    );
    expect(screen.getByText("App")).toBeInTheDocument();
  });

  it("shows a success toast when triggered", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    await user.click(screen.getByText("Success"));
    expect(screen.getByText("Succès !")).toBeInTheDocument();
    expect(screen.getByText("Opération réussie")).toBeInTheDocument();
  });

  it("shows an error toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    await user.click(screen.getByText("Error"));
    expect(screen.getByText("Erreur !")).toBeInTheDocument();
  });

  it("shows a warning toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    await user.click(screen.getByText("Warning"));
    expect(screen.getByText("Attention !")).toBeInTheDocument();
  });

  it("shows an info toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    await user.click(screen.getByText("Info"));
    expect(screen.getByText("Info !")).toBeInTheDocument();
  });
});
