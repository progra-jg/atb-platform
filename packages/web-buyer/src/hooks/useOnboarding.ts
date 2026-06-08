import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { OnboardingData } from "../types/onboarding";
import { DEFAULT_ONBOARDING } from "../types/onboarding";
import { setRoleLock, setOnboardingCompleted } from "../services/roleLock";

export function useOnboarding() {
  const { user, refreshProfile } = useAuth();
  const pendingRef = useRef<Partial<OnboardingData>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [version, setVersion] = useState(0);

  const data = useMemo((): OnboardingData => {
    if (!user?.metadata?.onboarding) return DEFAULT_ONBOARDING;
    const merged = { ...DEFAULT_ONBOARDING, ...user.metadata.onboarding };
    return { ...merged, ...pendingRef.current };
  }, [user?.metadata?.onboarding, version]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const flush = useCallback(async () => {
    if (!user) {
      pendingRef.current = {};
      return;
    }
    const partial = { ...pendingRef.current };
    pendingRef.current = {};
    if (Object.keys(partial).length === 0) return;
    const merged = { ...(user?.metadata?.onboarding ?? DEFAULT_ONBOARDING), ...partial };
    try {
      await api.put("/auth/profile", {
        metadata: { ...(user?.metadata ?? {}), onboarding: merged },
      });
      await refreshProfile();
    } catch (e) {
      console.warn("onboarding flush failed", e);
    }
  }, [user, refreshProfile]);

  const save = useCallback(async (partial: Partial<OnboardingData>) => {
    pendingRef.current = { ...pendingRef.current, ...partial };
    setVersion((v) => v + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { flush(); }, 600);
  }, [flush]);

  const saveImmediate = useCallback(async (partial: Partial<OnboardingData>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = { ...pendingRef.current, ...partial };
    await flush();
  }, [flush]);

  const needsOnboarding = useMemo(() => {
    if (!user) return false;
    return user.metadata?.onboarding?.completed !== true;
  }, [user]);

  const complete = useCallback(async () => {
    await saveImmediate({ completed: true });
    const finalType = user?.metadata?.onboarding?.userType ?? pendingRef.current.userType;
    if (finalType) {
      setRoleLock(finalType as "farmer" | "potential_buyer" | "active_buyer" | "other");
    }
    setOnboardingCompleted();
  }, [saveImmediate, user]);

  return { data, needsOnboarding, save, saveImmediate, complete };
}
