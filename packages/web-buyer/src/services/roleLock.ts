import type { UserType } from "../types/onboarding";

const ROLE_LOCK_KEY = "atb_role_lock";
const COMPLETED_KEY = "atb_onboarding_completed";

export function setRoleLock(userType: UserType): void {
  try {
    localStorage.setItem(ROLE_LOCK_KEY, userType);
  } catch { }
}

export function getRoleLock(): UserType | null {
  try {
    const val = localStorage.getItem(ROLE_LOCK_KEY);
    if (val === "farmer" || val === "potential_buyer" || val === "active_buyer" || val === "other") {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearRoleLock(): void {
  try {
    localStorage.removeItem(ROLE_LOCK_KEY);
    localStorage.removeItem(COMPLETED_KEY);
  } catch { }
}

export function setOnboardingCompleted(): void {
  try {
    localStorage.setItem(COMPLETED_KEY, "true");
  } catch { }
}

export function getOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}
