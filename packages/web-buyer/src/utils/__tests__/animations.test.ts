import { describe, it, expect } from "vitest";
import { fadeUp, fadeIn, scaleIn, slideUpBounce, stagger, pageTransition } from "../animations";

describe("animations variants", () => {
  it("fadeUp has opacity and y in hidden", () => {
    const h = fadeUp.hidden as Record<string, unknown>;
    expect(h.opacity).toBe(0);
    expect(h.y).toBe(16);
  });

  it("fadeUp visible when called returns opacity=1 y=0", () => {
    const v = (fadeUp.visible as (d?: number) => Record<string, unknown>)(0);
    expect(v.opacity).toBe(1);
    expect(v.y).toBe(0);
    expect((v.transition as Record<string, unknown>).duration).toBe(0.5);
  });

  it("fadeIn has opacity transitions", () => {
    const h = fadeIn.hidden as Record<string, unknown>;
    expect(h.opacity).toBe(0);
    const v = (fadeIn.visible as (d?: number) => Record<string, unknown>)(0);
    expect(v.opacity).toBe(1);
  });

  it("scaleIn scales from 0.95", () => {
    const h = scaleIn.hidden as Record<string, unknown>;
    expect(h.scale).toBe(0.95);
    const v = (scaleIn.visible as (d?: number) => Record<string, unknown>)(0);
    expect(v.scale).toBe(1);
  });

  it("slideUpBounce visible function works", () => {
    const v = (slideUpBounce.visible as (d?: number) => Record<string, unknown>)(0);
    expect(v.y).toBe(0);
    expect(v.scale).toBe(1);
  });

  it("stagger has correct staggerChildren", () => {
    const s = stagger.visible as Record<string, unknown>;
    const t = (s.transition ?? {}) as Record<string, unknown>;
    expect(t.staggerChildren).toBe(0.06);
  });

  it("pageTransition has exit state", () => {
    const e = pageTransition.exit as Record<string, unknown>;
    expect(e.opacity).toBe(0);
    expect(e.y).toBe(-8);
  });

  it("all variants have hidden and visible properties", () => {
    const variants = [fadeUp, fadeIn, scaleIn, slideUpBounce, stagger] as const;
    for (const v of variants) {
      expect(v).toHaveProperty("hidden");
      expect(v).toHaveProperty("visible");
    }
  });

  it("pageTransition has initial/animate/exit", () => {
    expect(pageTransition).toHaveProperty("initial");
    expect(pageTransition).toHaveProperty("animate");
    expect(pageTransition).toHaveProperty("exit");
  });
});
