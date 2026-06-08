import { describe, it, expect } from "vitest";
import { isRTL, marginStart, marginEnd, paddingStart, paddingEnd, textAlignStart, textAlignEnd, flexDirection } from "../rtl";

describe("isRTL", () => {
  it("returns false for fr", () => {
    expect(isRTL("fr")).toBe(false);
  });

  it("returns false for en", () => {
    expect(isRTL("en")).toBe(false);
  });

  it("returns true for ar", () => {
    expect(isRTL("ar")).toBe(true);
  });

  it("returns true for he", () => {
    expect(isRTL("he")).toBe(true);
  });
});

describe("marginStart", () => {
  it("returns marginLeft for LTR", () => {
    const result = marginStart("16px");
    expect(result).toHaveProperty("marginLeft", "16px");
    expect(result).not.toHaveProperty("marginRight");
  });
});

describe("marginEnd", () => {
  it("returns marginRight for LTR", () => {
    const result = marginEnd("16px");
    expect(result).toHaveProperty("marginRight", "16px");
  });
});

describe("paddingStart", () => {
  it("returns paddingLeft for LTR", () => {
    const result = paddingStart("12px");
    expect(result).toHaveProperty("paddingLeft", "12px");
  });
});

describe("paddingEnd", () => {
  it("returns paddingRight for LTR", () => {
    const result = paddingEnd("12px");
    expect(result).toHaveProperty("paddingRight", "12px");
  });
});

describe("textAlignStart", () => {
  it("returns left for LTR", () => {
    const result = textAlignStart();
    expect(result.textAlign).toBe("left");
  });
});

describe("textAlignEnd", () => {
  it("returns right for LTR", () => {
    const result = textAlignEnd();
    expect(result.textAlign).toBe("right");
  });
});

describe("flexDirection", () => {
  it("returns row for LTR", () => {
    expect(flexDirection()).toBe("row");
  });
});
