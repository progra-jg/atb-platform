import i18n from "../i18n";

function locale(): string {
  return i18n.language === "fr" ? "fr-FR" : "en-US";
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale(), options).format(n);
}

export function formatCurrency(
  n: number,
  currency: string = "XOF",
  maxFractionDigits: number = 0,
): string {
  return formatNumber(n, { style: "currency", currency, maximumFractionDigits: maxFractionDigits });
}

export function formatWeight(n: number, unit: string = "kg"): string {
  return `${formatNumber(n)} ${unit}`;
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat(locale(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale(), options).format(d);
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date | string | number): string {
  return formatDate(date, { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(date: Date | string | number): string {
  return formatDate(date, { hour: "2-digit", minute: "2-digit" });
}
