import { describe, it, expect } from "vitest";
import { sanitize, issueCsrfToken, generateCsrfToken, validateCsrfToken, RateLimiter } from "../security";

describe("sanitize", () => {
  it("escapes HTML special characters", () => {
    expect(sanitize("<script>alert('xss')</script>hello")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;hello"
    );
  });

  it("preserves safe text", () => {
    const safe = "Hello world";
    expect(sanitize(safe)).toBe(safe);
  });

  it("trims whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("escapes double quotes", () => {
    expect(sanitize('he said "hello"')).toBe("he said &quot;hello&quot;");
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });
});

describe("CSRF Token", () => {
  it("generates a 64-character hex token", () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens each call", () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });

  it("validates an issued token", () => {
    const token = issueCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(validateCsrfToken("not-a-valid-token")).toBe(false);
    expect(validateCsrfToken("")).toBe(false);
  });

  it("rejects a generated token that was not issued", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(false);
  });
});

describe("RateLimiter", () => {
  it("allows requests within limit", () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.allow()).toBe(true);
    expect(limiter.allow()).toBe(true);
    expect(limiter.allow()).toBe(true);
  });

  it("blocks requests over limit", () => {
    const limiter = new RateLimiter(2, 60000);
    expect(limiter.allow()).toBe(true);
    expect(limiter.allow()).toBe(true);
    expect(limiter.allow()).toBe(false);
  });

  it("returns remaining count", () => {
    const limiter = new RateLimiter(3, 60000);
    limiter.allow();
    expect(limiter.remaining()).toBe(2);
  });

  it("resets after window expires", async () => {
    const limiter = new RateLimiter(1, 10);
    limiter.allow();
    expect(limiter.allow()).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(limiter.allow()).toBe(true);
  });
});
