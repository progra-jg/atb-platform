import { useState, useRef, useCallback, useEffect } from "react";
import { Animated } from "react-native";

const FRAME_BUDGET = 16; // 60 FPS = 16ms par frame
const CHECK_INTERVAL = 2000; // Vérification toutes les 2s
const THRESHOLD = 3; // 3 frames lentes = passage en mode critique

/**
 * Performance Monitor (Thermal-Throttling UI).
 *
 * Mesure la latence du requestAnimationFrame.
 * Si le temps de rendu dépasse 16ms à plusieurs reprises,
 * bascule en mode "Performance Critique" :
 * - Suppression des ombres et dégradés
 * - Animations coupées (0ms)
 * - Pré-chargement audio suspendu
 */
export function usePerformanceMonitor() {
  const [isCritical, setIsCritical] = useState(false);
  const slowFrames = useRef(0);
  const lastFrameTime = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    let intervalId: ReturnType<typeof setInterval>;

    const checkFrame = (time: number) => {
      const delta = time - lastFrameTime.current;
      lastFrameTime.current = time;

      if (delta > FRAME_BUDGET) {
        slowFrames.current += 1;
      } else {
        slowFrames.current = Math.max(0, slowFrames.current - 1);
      }
      rafId = requestAnimationFrame(checkFrame);
    };

    // Vérification périodique
    intervalId = setInterval(() => {
      if (slowFrames.current >= THRESHOLD) {
        setIsCritical(true);
      } else if (slowFrames.current === 0) {
        setIsCritical(false);
      }
    }, CHECK_INTERVAL);

    rafId = requestAnimationFrame(checkFrame);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
    };
  }, []);

  return { isPerformanceMode: isCritical };
}
