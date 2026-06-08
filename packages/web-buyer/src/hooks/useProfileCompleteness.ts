import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "./useUserProfile";

export interface CompletenessSection {
  key: string;
  labelKey: string;
  items: CompletenessItem[];
  complete: boolean;
  score: number;
  total: number;
}

export interface CompletenessItem {
  key: string;
  labelKey: string;
  filled: boolean;
  link?: string;
}

export interface ProfileCompleteness {
  score: number;
  total: number;
  percentage: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  tierLabelKey: string;
  sections: CompletenessSection[];
  missingCount: number;
  isComplete: boolean;
}

function nonEmpty(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function arrNonEmpty(v: string[] | null | undefined): boolean {
  return Array.isArray(v) && v.length > 0;
}

const TIERS = [
  { threshold: 86, tier: "platinum" as const, key: "profileCompleteness.tier.platinum" },
  { threshold: 61, tier: "gold" as const, key: "profileCompleteness.tier.gold" },
  { threshold: 31, tier: "silver" as const, key: "profileCompleteness.tier.silver" },
  { threshold: 0, tier: "bronze" as const, key: "profileCompleteness.tier.bronze" },
];

export function useProfileCompleteness(): ProfileCompleteness {
  const { user } = useAuth();
  const profile = useUserProfile();
  const onboarding = profile.onboarding;

  return useMemo(() => {
    const sections: CompletenessSection[] = [
      {
        key: "identity",
        labelKey: "profileCompleteness.section.identity",
        items: [
          { key: "company", labelKey: "profileCompleteness.item.company", filled: nonEmpty(user?.company), link: "/settings?tab=profil" },
          { key: "phone", labelKey: "profileCompleteness.item.phone", filled: nonEmpty(user?.phone) || nonEmpty(onboarding.phone) },
          { key: "address", labelKey: "profileCompleteness.item.address", filled: nonEmpty(user?.address) },
        ],
        complete: false,
        score: 0,
        total: 3,
      },
      {
        key: "company",
        labelKey: "profileCompleteness.section.company",
        items: [
          { key: "sector", labelKey: "profileCompleteness.item.sector", filled: nonEmpty(onboarding.companySector) },
          { key: "size", labelKey: "profileCompleteness.item.size", filled: nonEmpty(onboarding.companySize) },
          { key: "ifu", labelKey: "profileCompleteness.item.ifu", filled: nonEmpty(onboarding.ifu) || nonEmpty(user?.metadata?.ifu) },
        ],
        complete: false,
        score: 0,
        total: 3,
      },
      {
        key: "interests",
        labelKey: "profileCompleteness.section.interests",
        items: [
          { key: "products", labelKey: "profileCompleteness.item.products", filled: arrNonEmpty(onboarding.productsOfInterest) },
          { key: "regions", labelKey: "profileCompleteness.item.regions", filled: arrNonEmpty(onboarding.regionsOfInterest) },
          { key: "volume", labelKey: "profileCompleteness.item.volume", filled: nonEmpty(onboarding.estimatedMonthlyVolume) },
        ],
        complete: false,
        score: 0,
        total: 3,
      },
      {
        key: "contact",
        labelKey: "profileCompleteness.section.contact",
        items: [
          { key: "contactName", labelKey: "profileCompleteness.item.contactName", filled: nonEmpty(user?.metadata?.nom) },
          { key: "contactFunction", labelKey: "profileCompleteness.item.contactFunction", filled: nonEmpty(user?.metadata?.fonction) },
          { key: "onboardingDone", labelKey: "profileCompleteness.item.onboardingDone", filled: onboarding.completed === true },
        ],
        complete: false,
        score: 0,
        total: 3,
      },
    ];

    let totalScore = 0;
    let totalMax = 0;
    let missingCount = 0;

    for (const section of sections) {
      let sectionScore = 0;
      for (const item of section.items) {
        if (item.filled) sectionScore++;
        else missingCount++;
      }
      section.score = sectionScore;
      section.complete = sectionScore === section.total;
      totalScore += sectionScore;
      totalMax += section.total;
    }

    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const tierDef = TIERS.find((t) => percentage >= t.threshold) ?? TIERS[TIERS.length - 1];

    return {
      score: totalScore,
      total: totalMax,
      percentage,
      tier: tierDef.tier,
      tierLabelKey: tierDef.key,
      sections,
      missingCount,
      isComplete: percentage === 100,
    };
  }, [user, onboarding]);
}
