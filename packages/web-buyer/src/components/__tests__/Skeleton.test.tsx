import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonText, SkeletonCard, SkeletonAvatar } from "../ui/Skeleton";

describe("Skeleton components", () => {
  it("SkeletonText renders specified number of lines", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll("[style]");
    const shimmerDivs = container.querySelectorAll("div > div > div");
    expect(shimmerDivs.length).toBe(3);
  });

  it("SkeletonCard renders with default height", () => {
    const { container } = render(<SkeletonCard />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.height).toBe("160px");
  });

  it("SkeletonCard accepts custom height", () => {
    const { container } = render(<SkeletonCard height={300} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe("300px");
  });

  it("SkeletonAvatar renders a circle", () => {
    const { container } = render(<SkeletonAvatar />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.borderRadius).toBe("50%");
  });

  it("SkeletonAvatar accepts custom size", () => {
    const { container } = render(<SkeletonAvatar size={60} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("60px");
    expect(el.style.height).toBe("60px");
  });
});
