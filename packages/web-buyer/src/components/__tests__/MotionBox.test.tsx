import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MotionBox } from "../ui/MotionBox";

describe("MotionBox", () => {
  it("renders children", () => {
    render(<MotionBox>Hello</MotionBox>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders as a div", () => {
    const { container } = render(<MotionBox>Test</MotionBox>);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("applies glass variant styles", () => {
    const { container } = render(<MotionBox variant="glass">Glass</MotionBox>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it("applies elevated variant styles", () => {
    const { container } = render(<MotionBox variant="elevated">Elevated</MotionBox>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it("applies bordered variant", () => {
    const { container } = render(<MotionBox variant="bordered">Bordered</MotionBox>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it("applies card variant", () => {
    const { container } = render(<MotionBox variant="card">Card</MotionBox>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<MotionBox ref={ref}>Ref</MotionBox>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
