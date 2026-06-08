import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserType } from "../types/onboarding";
import { getRoleLock, getOnboardingCompleted } from "../services/roleLock";

export interface RoleInfo {
  userType: UserType | null;
  isFarmer: boolean;
  isBuyer: boolean;
  isOther: boolean;
  hasCompletedOnboarding: boolean;
}

export function useRole(): RoleInfo {
  const { user } = useAuth();

  return useMemo(() => {
    const liveUserType = user?.metadata?.onboarding?.userType ?? null;
    const liveCompleted = user?.metadata?.onboarding?.completed ?? false;
    const lockedRole = getRoleLock();
    const lockedCompleted = getOnboardingCompleted();

    const hasCompleted = liveCompleted || lockedCompleted;
    const userType: UserType | null = liveUserType ?? (hasCompleted ? lockedRole : null);

    return {
      userType,
      isFarmer: userType === "farmer",
      isBuyer: userType === "potential_buyer" || userType === "active_buyer",
      isOther: userType === "other",
      hasCompletedOnboarding: hasCompleted,
    };
  }, [user]);
}
