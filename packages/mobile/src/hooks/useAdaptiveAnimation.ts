import { useContext } from "react";
import { PerformanceContext } from "../contexts/PerformanceContext";

/**
 * Hook pour animations adaptatives.
 * En mode Performance Critique, toutes les durées d'animation
 * sont forcées à 0ms pour éviter les dropped frames.
 */
export function useAdaptiveAnimation(defaultDuration: number) {
  const { isPerformanceMode } = useContext(PerformanceContext);

  return {
    /** Durée réelle de l'animation (0 en mode critique) */
    duration: isPerformanceMode ? 0 : defaultDuration,
    /** true si les animations doivent être désactivées */
    freeze: isPerformanceMode,
  };
}
