import { useState, useEffect } from "react";
import { breakpoint as bp } from "../styles/designTokens";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const breakpoints = {
  sm: `(max-width: ${bp.sm - 1}px)`,
  mobile: `(max-width: ${bp.md - 1}px)`,
  tablet: `(min-width: ${bp.md}px) and (max-width: ${bp.lg - 1}px)`,
  desktop: `(min-width: ${bp.lg}px)`,
  smallMobile: "(max-width: 480px)",
} as const;

export function useIsMobile() {
  return useMediaQuery(breakpoints.mobile);
}

export function useIsTablet() {
  return useMediaQuery(breakpoints.tablet);
}

export function useIsDesktop() {
  return useMediaQuery(breakpoints.desktop);
}

export function useIsSmall() {
  return useMediaQuery(breakpoints.sm);
}
