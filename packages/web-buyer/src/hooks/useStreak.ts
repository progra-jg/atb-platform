import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { updateStreak, addFreeze, useFreeze, initStreak } from "../services/streak";
import type { StreakState } from "../types/streak";
import { getStreakState } from "../services/streak";

export function useStreak() {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<StreakState>(() => getStreakState());
  const [synced, setSynced] = useState(false);

  const refresh = useCallback(async () => {
    if (userId && !synced) {
      try {
        const s = await initStreak(userId);
        setState(s);
        setSynced(true);
        return;
      } catch {
        /* offline fallback */
      }
    }
    const s = await updateStreak(userId);
    setState(s);
  }, [userId, synced]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddFreeze = useCallback(async (amount?: number) => {
    const s = await addFreeze(userId, amount);
    setState(s);
  }, [userId]);

  const handleUseFreeze = useCallback(async () => {
    const s = await useFreeze(userId);
    setState(s);
  }, [userId]);

  return {
    ...state,
    refresh,
    addFreeze: handleAddFreeze,
    useFreeze: handleUseFreeze,
  };
}
