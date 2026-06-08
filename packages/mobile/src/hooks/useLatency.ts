import { useRef, useCallback } from "react";

const MIN_LATENCY = 800;
const MAX_LATENCY = 1200;

/**
 * Retourne une fonction qui ajoute un délai artificiel de 800-1200ms
 * avant d'exécuter l'action critique.
 * L'utilisateur perçoit le "poids" de l'opération (hash, KYC, séquestre).
 */
export function useLatency() {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const wait = useCallback((action: () => void | Promise<void>) => {
    const delay = MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
    return new Promise<void>((resolve) => {
      timer.current = setTimeout(async () => {
        await action();
        resolve();
      }, delay);
    });
  }, []);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { wait, cancel };
}

/** Version synchrone : retourne une promesse qui attend 800-1200ms */
export function artificialLatency(): Promise<void> {
  const delay = MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
  return new Promise((r) => setTimeout(r, delay));
}
