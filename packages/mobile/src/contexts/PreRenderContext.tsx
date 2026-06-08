import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useSensorStore } from "../store/sensorStore";

interface PreRenderContextValue {
  shouldPreRender: boolean;
  markRendered: () => void;
  /** true si l'utilisateur a consenti à l'utilisation des capteurs */
  sensorConsented: boolean;
}

const PreRenderContext = createContext<PreRenderContextValue>({
  shouldPreRender: false,
  markRendered: () => {},
  sensorConsented: false,
});

/**
 * Pre-Render Provider.
 * N'écoute l'accéléromètre QUE si l'utilisateur a donné son consentement
 * via le dialogue natif (sensorStore.requestConsent()).
 */
export function PreRenderProvider({ children }: { children: ReactNode }) {
  const [tilt, setTilt] = useState<number | null>(null);
  const [shouldPreRender, setShouldPreRender] = useState(false);
  const stableStart = useRef<number | null>(null);
  const lastAngle = useRef<number | null>(null);
  const sensorConsented = useSensorStore((s) => s.sensorConsent);

  useEffect(() => {
    if (!sensorConsented) {
      setTilt(null);
      setShouldPreRender(false);
      stableStart.current = null;
      lastAngle.current = null;
      return;
    }

    const handler = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const angle = Math.round(Math.abs(beta) + Math.abs(gamma) * 0.5);
      setTilt(angle);
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [sensorConsented]);

  useEffect(() => {
    if (tilt === null) return;
    if (tilt >= 25 && tilt <= 50) {
      if (!stableStart.current) stableStart.current = Date.now();
      if (Date.now() - stableStart.current >= 500 && tilt === lastAngle.current) {
        setShouldPreRender(true);
      }
    } else {
      stableStart.current = null;
      setShouldPreRender(false);
    }
    lastAngle.current = tilt;
  }, [tilt]);

  const markRendered = () => setShouldPreRender(false);

  return (
    <PreRenderContext.Provider value={{ shouldPreRender, markRendered, sensorConsented }}>
      {children}
    </PreRenderContext.Provider>
  );
}

export function usePreRender() {
  return useContext(PreRenderContext);
}
