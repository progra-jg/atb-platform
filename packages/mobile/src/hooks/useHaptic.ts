import { useCallback } from "react";
import { Vibration, Platform } from "react-native";

/**
 * Hook pour micro-triggers haptiques.
 * - success : vibration courte (confirmation transaction)
 * - error : vibration longue (alerte)
 * - click : micro-tick imperceptible (réassurance navigation)
 * - lock : double vibration lourde "clac-clac" (fermeture cadenas physique)
 * - release : micro-vibration ascendante fluide (libération fonds)
 */
export type HapticType = "success" | "error" | "click" | "lock" | "release";

export function useHaptic() {
  const trigger = useCallback((type: HapticType) => {
    if (Platform.OS === "web") return;
    const pattern =
      type === "success" ? [0, 50, 30, 50]
      : type === "error" ? [0, 100, 50, 100, 50, 100]
      : type === "lock" ? [0, 80, 40, 120]  // clac...clac (cadenas)
      : type === "release" ? [0, 30, 20, 40, 20, 60]  // ascendant fluide
      : [0, 15]; // click par défaut
    Vibration.vibrate(pattern);
  }, []);

  return { trigger };
}
