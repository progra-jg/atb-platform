import i18n from "../i18n";

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

export function isRTL(lang?: string): boolean {
  return RTL_LANGS.has(lang || i18n.language);
}

export function useIsRTL(): boolean {
  return isRTL(i18n.language);
}

export function marginStart(v: string): Record<string, string> {
  return isRTL() ? { marginRight: v } : { marginLeft: v };
}

export function marginEnd(v: string): Record<string, string> {
  return isRTL() ? { marginLeft: v } : { marginRight: v };
}

export function paddingStart(v: string): Record<string, string> {
  return isRTL() ? { paddingRight: v } : { paddingLeft: v };
}

export function paddingEnd(v: string): Record<string, string> {
  return isRTL() ? { paddingLeft: v } : { paddingRight: v };
}

export function borderStart(v: string): Record<string, string> {
  return isRTL()
    ? { borderRight: v, borderLeft: "none" }
    : { borderLeft: v, borderRight: "none" };
}

export function textAlignStart(): Record<string, string> {
  return { textAlign: isRTL() ? "right" as const : "left" as const };
}

export function textAlignEnd(): Record<string, string> {
  return { textAlign: isRTL() ? "left" as const : "right" as const };
}

export function translateXStart(v: string): string {
  return isRTL() ? `translateX(-${v})` : `translateX(${v})`;
}

export function flexDirection(): "row-reverse" | "row" {
  return isRTL() ? "row-reverse" : "row";
}
