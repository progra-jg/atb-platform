import { useState, useEffect, useRef, useCallback } from "react";

const STABLE_ANGLE_MIN = 25;
const STABLE_ANGLE_MAX = 50;
const STABLE_THRESHOLD_MS = 600;

/**
 * Hook de détection d'inclinaison.
 *
 * Nécessite le consentement utilisateur (sensorStore.requestConsent()).
 * Quand l'appareil passe en angle de lecture stable (25-50°), signale
 * un pré-rendu potentiel.
 *
 * @param enabled - Doit être true (consentement donné) pour activer l'écoute
 */
export function useDeviceTilt(enabled: boolean) {
  const [tilt, setTilt] = useState<number | null>(null);
  const [isReadingAngle, setIsReadingAngle] = useState(false);
  const stableStart = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTilt(null);
      setIsReadingAngle(false);
      stableStart.current = null;
      return;
    }

    const handler = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const angle = Math.abs(beta) + Math.abs(gamma) * 0.5;
      setTilt(Math.round(angle));
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [enabled]);

  useEffect(() => {
    if (tilt === null) return;

    if (tilt >= STABLE_ANGLE_MIN && tilt <= STABLE_ANGLE_MAX) {
      if (!stableStart.current) stableStart.current = Date.now();
      if (Date.now() - stableStart.current >= STABLE_THRESHOLD_MS) {
        setIsReadingAngle(true);
      }
    } else {
      stableStart.current = null;
      setIsReadingAngle(false);
    }
  }, [tilt]);

  const reset = useCallback(() => {
    setIsReadingAngle(false);
    stableStart.current = null;
  }, []);

  return {
    tilt,
    isReadingAngle,
    isOptimal: tilt !== null && tilt >= 30 && tilt <= 45,
    reset,
  };
}
