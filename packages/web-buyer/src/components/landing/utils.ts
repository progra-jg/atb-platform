import type { i18n } from "i18next";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export type IconType = PhosphorIcon;

export function alphaColor(isDark: boolean, a: number) {
  return isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
}

export function switchLanguage(i18n: i18n) {
  const l = i18n.language === "fr" ? "en" : "fr";
  i18n.changeLanguage(l);
  localStorage.setItem("lang", l);
}

export interface TrustBadge {
  icon: IconType;
  labelKey: string;
  color: string;
}

export interface Testimonial {
  id: string;
  rating: number;
}

export interface Stat {
  target: number;
  icon: IconType;
  labelKey: string;
  suffix: string;
}

export interface Feature {
  icon: IconType;
  titleKey: string;
  descKey: string;
}

export interface Step {
  icon: IconType;
  titleKey: string;
  descKey: string;
}

export interface SectionLink {
  labelKey: string;
  refId: string;
}

export interface RoseParticle {
  x: number;
  drift: number;
  dur: number;
  delay: number;
}

export interface CustomCSSProperties extends React.CSSProperties {
  "--drift"?: string;
}
