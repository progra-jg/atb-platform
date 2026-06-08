import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import type { OnboardingData, UserType } from "../types/onboarding";
import { DEFAULT_ONBOARDING } from "../types/onboarding";

export interface UserProfile {
  onboarding: OnboardingData;
  isPotentialBuyer: boolean;
  isActiveBuyer: boolean;
  isFarmer: boolean;
  isOther: boolean;
  isBuyer: boolean;
  hasCompany: boolean;
  interestsLabel: string;
  showEducationalContent: boolean;
  showMarketplace: boolean;
  showPricing: boolean;
  showProducerTools: boolean;
  dashboardVariant: "discovery" | "active" | "farmer" | "default";
}

export function useUserProfile(): UserProfile {
  const { user } = useAuth();

  return useMemo(() => {
    const raw: OnboardingData = user?.metadata?.onboarding ?? DEFAULT_ONBOARDING;
    const onboarding: OnboardingData = { ...DEFAULT_ONBOARDING, ...raw };
    const type = onboarding.userType;

    const isPotentialBuyer = type === "potential_buyer";
    const isActiveBuyer = type === "active_buyer";
    const isFarmer = type === "farmer";
    const isOther = type === "other";
    const isBuyer = isPotentialBuyer || isActiveBuyer;
    const hasCompany = onboarding.hasCompany;

    const products = onboarding.productsOfInterest ?? [];
    const regions = onboarding.regionsOfInterest ?? [];
    const interestsLabel = [...products, ...regions].length > 0
      ? [...products.slice(0, 2), ...regions.slice(0, 1)].join(", ")
      : "";

    const dashboardVariant = isPotentialBuyer ? "discovery"
      : isActiveBuyer ? "active"
      : isFarmer ? "farmer"
      : "default";

    return {
      onboarding,
      isPotentialBuyer,
      isActiveBuyer,
      isFarmer,
      isOther,
      isBuyer,
      hasCompany,
      interestsLabel,
      showEducationalContent: isPotentialBuyer || isOther,
      showMarketplace: isActiveBuyer || isBuyer,
      showPricing: isBuyer,
      showProducerTools: isFarmer,
      dashboardVariant,
    };
  }, [user?.metadata?.onboarding]);
}
