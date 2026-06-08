function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
    "'": "&#x27;", "`": "&#x60;",
  };
  return str.replace(/[&<>"'`]/g, (ch) => map[ch] || ch);
}

export function sanitize(input: string, max = 5000): string {
  if (typeof input !== "string") return "";
  return escapeHtml(input.trim()).slice(0, max);
}

export function stripTags(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").replace(/[<>&"'`]/g, "").trim();
}

export function sanitizeAddress(input: string): string {
  return stripTags(input).slice(0, 200).replace(/[;|$%&(){}\[\]<>]/g, "");
}

export function validateNumber(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function validateSafeInteger(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
}

export function generateNonce(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${ts}-${rand}-${hex}`;
}

export function validateEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stripTags(input).slice(0, 254));
}

export function validatePhone(input: string): boolean {
  const cleaned = input.replace(/[\s+\-()]/g, "");
  return /^\d{6,15}$/.test(cleaned);
}

export function csrfSafeMethod(method: string): boolean {
  return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method.toUpperCase());
}

export interface PasswordRule {
  key: string;
  test: (p: string) => boolean;
  label: string;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "min", test: (p) => p.length >= 8, label: "8 caractères min" },
  { key: "upper", test: (p) => /[A-Z]/.test(p), label: "1 majuscule" },
  { key: "lower", test: (p) => /[a-z]/.test(p), label: "1 minuscule" },
  { key: "digit", test: (p) => /\d/.test(p), label: "1 chiffre" },
  { key: "special", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: "1 caractère spécial" },
];

let csrfStore: string[] = [];

export function generateCsrfToken(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function issueCsrfToken(): string {
  const token = generateCsrfToken();
  csrfStore.push(token);
  if (csrfStore.length > 100) csrfStore = csrfStore.slice(-50);
  return token;
}

export function validateCsrfToken(token: string): boolean {
  if (!token || token.length !== 64) return false;
  const idx = csrfStore.indexOf(token);
  if (idx !== -1) { csrfStore.splice(idx, 1); return true; }
  return false;
}

export class RateLimiter {
  private hits: number[] = [];
  constructor(private limit: number, private windowMs: number) {}

  allow(): boolean {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.limit) return false;
    this.hits.push(now);
    return true;
  }

  remaining(): number {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.limit - this.hits.length);
  }
}

const REGISTER_LIMITER = new RateLimiter(5, 60000);

export function checkRegisterRateLimit(): { allowed: boolean; resetAfterMs: number } {
  const allowed = REGISTER_LIMITER.allow();
  const remaining = REGISTER_LIMITER.remaining();
  return { allowed, resetAfterMs: remaining <= 0 ? 60000 : 0 };
}
