import { describe, it, expect } from "vitest";
import { analyzePassword } from "../passwordStrength";

describe("analyzePassword", () => {
  const weak = analyzePassword("");
  const medium = analyzePassword("Abcdef1");
  const strong = analyzePassword("Kz9m$Xp4!Lm2@Qr7");

  it("returns a score between 0 and 100", () => {
    expect(weak.score).toBeGreaterThanOrEqual(0);
    expect(strong.score).toBeLessThanOrEqual(100);
    expect(weak.score).toBeLessThan(medium.score);
    expect(medium.score).toBeLessThan(strong.score);
  });

  it("detects very weak passwords (score=0 for empty)", () => {
    expect(analyzePassword("").score).toBe(0);
    expect(analyzePassword("").strengthLabel).toBe("Très faible");
  });

  it("returns crackTimeLabel for all levels", () => {
    expect(weak.crackTimeLabel).toBeDefined();
    expect(strong.crackTimeLabel).toBeDefined();
    expect(strong.crackTimeLabel).not.toBe(weak.crackTimeLabel);
  });

  it("returns checks object", () => {
    const result = analyzePassword("Test1234!");
    expect(result.checks).toHaveProperty("length");
    expect(typeof result.checks.length).toBe("boolean");
    expect(typeof result.checks.uppercase).toBe("boolean");
  });

  it("flags common passwords", () => {
    expect(analyzePassword("azerty123").checks.noCommon).toBe(false);
  });

  it("handles repeated characters", () => {
    const result = analyzePassword("aaaaaa1A");
    expect(result.checks.noRepeat).toBe(false);
    expect(result.feedback.some((f) => f.includes("répét"))).toBe(true);
  });

  it("handles keyboard patterns (qwerty)", () => {
    const result = analyzePassword("qwerty123A");
    expect(result.checks.noSequence).toBe(false);
  });

  it("handles keyboard patterns (azerty)", () => {
    const result = analyzePassword("azerty123A");
    expect(result.checks.noSequence).toBe(false);
  });

  it("handles sequential characters", () => {
    const result = analyzePassword("abcdef1A");
    expect(result.feedback.some((f) => f.includes("suite"))).toBe(true);
  });

  it("gives high score for very long random passwords", () => {
    const long = analyzePassword("aB3$".repeat(8));
    expect(long.score).toBeGreaterThanOrEqual(70);
    expect(long.strengthLabel).toBe("Très fort");
  });

  it("penalizes short simple passwords", () => {
    const short = analyzePassword("a");
    expect(short.score).toBeLessThan(50);
  });

  it("rejects empty passwords", () => {
    const empty = analyzePassword("");
    expect(empty.score).toBe(0);
    expect(empty.strengthLabel).toBe("Très faible");
  });

  it("returns all required fields", () => {
    const result = analyzePassword("Test1234!");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("strengthLabel");
    expect(result).toHaveProperty("crackTimeLabel");
    expect(result).toHaveProperty("checks");
    expect(Array.isArray(result.feedback)).toBe(true);
  });

  it("calculates entropy consistently", () => {
    const r1 = analyzePassword("MySecretP@ss1");
    const r2 = analyzePassword("MySecretP@ss1");
    expect(r1.score).toBe(r2.score);
  });
});
