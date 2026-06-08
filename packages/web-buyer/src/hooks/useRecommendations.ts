import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "./useUserProfile";
import { useProfileCompleteness } from "./useProfileCompleteness";
import { getPersonalizedFeed, getSmartPicks, buildBuyerProfile } from "../services/recommendations";
import { calculateESGScore } from "../services/esg";
import type { RecommendationFeed, LotMatch } from "../types/recommendation";

export function useRecommendations() {
  const { user } = useAuth();
  const profile = useUserProfile();
  const { percentage } = useProfileCompleteness();
  const [feed, setFeed] = useState<RecommendationFeed | null>(null);
  const [picks, setPicks] = useState<LotMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [prefs, esg] = await Promise.all([
        buildBuyerProfile(user.id),
        calculateESGScore(user.id, percentage, user).catch(() => null),
      ]);
      const enrichedPrefs = {
        ...prefs,
        products: profile.onboarding.productsOfInterest,
        regions: profile.onboarding.regionsOfInterest,
        volume: profile.onboarding.estimatedMonthlyVolume,
      };
      const [f, p] = await Promise.all([
        getPersonalizedFeed(user.id, enrichedPrefs, esg ?? undefined),
        getSmartPicks(user.id, enrichedPrefs),
      ]);
      setFeed(f);
      setPicks(p);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user, percentage, profile.onboarding.productsOfInterest, profile.onboarding.regionsOfInterest, profile.onboarding.estimatedMonthlyVolume]);

  useEffect(() => { load(); }, [load]);

  return { feed, picks, loading, refresh: load };
}
