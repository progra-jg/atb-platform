import { describe, it, expect, beforeEach, afterEach } from "vitest";
import i18n from "../../i18n";
import { formatNumber, formatCurrency, formatWeight, formatCompact, formatDate, formatDateTime, formatDateShort, formatTime } from "../format";

function setLang(lang: "fr" | "en") {
  i18n.changeLanguage(lang);
}

const NBSP = "\u202f";

describe("formatNumber", () => {
  beforeEach(() => setLang("fr"));
  afterEach(() => setLang("fr"));

  it("formats with fr-FR locale (espace insécable)", () => {
    setLang("fr");
    expect(formatNumber(1234567)).toBe(`1${NBSP}234${NBSP}567`);
  });

  it("formats with en-US locale (comma separator)", () => {
    setLang("en");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-5000)).toBe(`-5${NBSP}000`);
  });

  it("accepts Intl options for decimals", () => {
    expect(formatNumber(1234.567, { maximumFractionDigits: 2 })).toBe(`1${NBSP}234,57`);
  });
});

describe("formatCurrency", () => {
  it("formats XOF with fr-FR", () => {
    setLang("fr");
    const result = formatCurrency(1500000);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(5);
  });

  it("accepts custom currency", () => {
    setLang("en");
    const result = formatCurrency(99.99, "USD", 2);
    expect(result).toContain("99");
  });
});

describe("formatWeight", () => {
  it("formats weight with unit", () => {
    setLang("fr");
    expect(formatWeight(2500)).toBe(`2${NBSP}500 kg`);
  });

  it("accepts custom unit", () => {
    expect(formatWeight(1000, "tonnes")).toBe(`1${NBSP}000 tonnes`);
  });
});

describe("formatCompact", () => {
  it("formats large numbers compactly", () => {
    setLang("fr");
    const result = formatCompact(1500000);
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan(6);
  });
});

describe("formatDate", () => {
  it("formats date with fr-FR locale", () => {
    setLang("fr");
    const d = new Date(2024, 2, 19);
    const result = formatDate(d, { day: "numeric", month: "long", year: "numeric" });
    expect(result).toContain("mars");
  });

  it("formats date with en-US locale", () => {
    setLang("en");
    const d = new Date(2024, 2, 19);
    const result = formatDate(d, { day: "numeric", month: "long", year: "numeric" });
    expect(result).toContain("March");
  });

  it("accepts ISO string input", () => {
    setLang("fr");
    const result = formatDate("2024-03-19T10:30:00Z", { day: "numeric", month: "short" });
    expect(result).toBeTruthy();
  });
});

describe("formatDateTime", () => {
  it("includes time in output", () => {
    setLang("fr");
    const d = new Date(2024, 2, 19, 14, 30);
    const result = formatDateTime(d);
    expect(result).toContain("14");
    expect(result).toContain("30");
  });
});

describe("formatDateShort", () => {
  it("returns short date", () => {
    setLang("en");
    const d = new Date(2024, 2, 19);
    const result = formatDateShort(d);
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan(20);
  });
});

describe("formatTime", () => {
  it("returns only time portion", () => {
    setLang("fr");
    const d = new Date(2024, 2, 19, 9, 5);
    const result = formatTime(d);
    expect(result).toContain("09");
    expect(result).toContain("05");
  });
});
