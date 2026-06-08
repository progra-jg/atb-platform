import {
  ShieldCheck, Leaf, Globe, ChartBar, CurrencyCircleDollar,
  Certificate, Binoculars, Handshake, Users, Fingerprint, Lock,
  SealCheck, Package,
} from "@phosphor-icons/react";
import type { TrustBadge, Testimonial, Stat, Feature, Step, SectionLink } from "./utils";

export const ease = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.08 },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.45, ease, delay: i * 0.06 },
  }),
};

export const TRUST_BADGES: TrustBadge[] = [
  { icon: ShieldCheck, labelKey: "landing.trustEudr", color: "#059669" },
  { icon: Fingerprint, labelKey: "landing.trustBlockchain", color: "#6366f1" },
  { icon: Lock, labelKey: "landing.trustEscrow", color: "#d97706" },
  { icon: SealCheck, labelKey: "landing.trustCert", color: "#0891b2" },
];

export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", rating: 5 }, { id: "t2", rating: 5 }, { id: "t3", rating: 5 },
  { id: "t4", rating: 5 }, { id: "t5", rating: 5 }, { id: "t6", rating: 5 },
  { id: "t7", rating: 5 }, { id: "t8", rating: 5 }, { id: "t9", rating: 5 },
];

export const STATS: Stat[] = [
  { target: 2400, icon: Package, labelKey: "landing.statsLots", suffix: "+" },
  { target: 850, icon: Users, labelKey: "landing.statsFarmers", suffix: "+" },
  { target: 12, icon: Globe, labelKey: "landing.statsCountries", suffix: "" },
  { target: 98, icon: ShieldCheck, labelKey: "landing.statsCompliance", suffix: "%" },
];

export const FEATURES: Feature[] = [
  { icon: Binoculars, titleKey: "landing.featureDiscover", descKey: "landing.featureDiscoverDesc" },
  { icon: ShieldCheck, titleKey: "landing.featureTrust", descKey: "landing.featureTrustDesc" },
  { icon: Globe, titleKey: "landing.featureTrade", descKey: "landing.featureTradeDesc" },
  { icon: CurrencyCircleDollar, titleKey: "landing.featurePay", descKey: "landing.featurePayDesc" },
  { icon: Certificate, titleKey: "landing.featureCert", descKey: "landing.featureCertDesc" },
  { icon: ChartBar, titleKey: "landing.featureIntel", descKey: "landing.featureIntelDesc" },
];

export const STEPS: Step[] = [
  { icon: Users, titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
  { icon: Binoculars, titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
  { icon: Handshake, titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
  { icon: Leaf, titleKey: "landing.step4Title", descKey: "landing.step4Desc" },
];

export const LOGOS = [
  "Sofitex", "Cargill", "Olam", "Nestlé", "Louis Dreyfus", "Ecobank",
] as const;

export const PRESS = [
  "Bloomberg", "Reuters", "Le Monde", "Jeune Afrique", "Financial Times", "Les Échos",
] as const;

export const SECTION_LINKS: SectionLink[] = [
  { labelKey: "landing.featuresLabel", refId: "features" },
  { labelKey: "landing.howLabel", refId: "how" },
  { labelKey: "landing.testimonialsLabel", refId: "testimonials" },
  { labelKey: "landing.newsletterTitle", refId: "newsletter" },
];
