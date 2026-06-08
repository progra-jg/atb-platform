import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import i18n from "../i18n";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHover: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  cardShadow: string;
  navbarBg: string;
  inputBg: string;
  tableHeaderBg: string;
  statBg: string;
  codeBg: string;
  shadowXs: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadowGlow: string;
  radiusXs: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;
  glassBg: string;
  glassBorder: string;
  glassBlur: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentGradient: string;
  accentGlow: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  gold: string;
  goldLight: string;
  skeleton: string;
}

export interface ThemeTokens {
  space: {
    xs: string; sm: string; md: string; lg: string; xl: string; xxl: string;
  };
  animation: {
    fast: string; normal: string; slow: string;
    spring: { stiffness: number; damping: number; mass: number };
    easing: string;
  };
}

export const TOKENS: ThemeTokens = {
  space: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "40px" },
  animation: {
    fast: "0.15s", normal: "0.25s", slow: "0.4s",
    spring: { stiffness: 400, damping: 25, mass: 1 },
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
};

const light: ThemeColors = {
  bg: "#f5f2ec",
  surface: "#ffffff",
  surfaceHover: "#eae5de",
  surfaceElevated: "#ffffff",
  text: "#1c1a17",
  textSecondary: "#706859",
  textMuted: "#a09888",
  border: "#ddd7cd",
  borderLight: "#e8e3da",
  cardShadow: "0 1px 2px rgba(28,26,23,0.04)",
  navbarBg: "linear-gradient(135deg, #0a3d25 0%, #0e5c3a 50%, #118053 100%)",
  inputBg: "#ffffff",
  tableHeaderBg: "#f0ece5",
  statBg: "#f0ece5",
  codeBg: "#e8e3da",
  shadowXs: "0 1px 2px rgba(28,26,23,0.04)",
  shadowSm: "0 2px 8px rgba(28,26,23,0.05)",
  shadowMd: "0 4px 16px rgba(28,26,23,0.07)",
  shadowLg: "0 8px 32px rgba(28,26,23,0.09)",
  shadowXl: "0 16px 48px rgba(28,26,23,0.11)",
  shadowGlow: "0 0 24px rgba(13,107,66,0.10)",
  radiusXs: "4px",
  radiusSm: "6px",
  radiusMd: "8px",
  radiusLg: "12px",
  radiusXl: "16px",
  radiusFull: "9999px",
  glassBg: "rgba(255,255,255,0.6)",
  glassBorder: "rgba(255,255,255,0.75)",
  glassBlur: "blur(20px) saturate(1.3)",
  accent: "#0d7a4a",
  accentLight: "#e6f2eb",
  accentDark: "#095233",
  accentGradient: "linear-gradient(135deg, #0a3d25 0%, #0d6b42 50%, #108052 100%)",
  accentGlow: "0 0 24px rgba(13,107,66,0.12)",
  success: "#059669",
  successLight: "#ecfdf5",
  warning: "#d97706",
  warningLight: "#fffbeb",
  error: "#dc2626",
  errorLight: "#fef2f2",
  info: "#2563eb",
  infoLight: "#eff6ff",
  gold: "#c4942e",
  goldLight: "#faf3e0",
  skeleton: "#e0dad1",
};

const dark: ThemeColors = {
  bg: "#0a0d0b",
  surface: "#111513",
  surfaceHover: "#181c19",
  surfaceElevated: "#1e221f",
  text: "#eae6de",
  textSecondary: "#9e988b",
  textMuted: "#696357",
  border: "#1e221f",
  borderLight: "#1e221f",
  cardShadow: "0 1px 2px rgba(0,0,0,0.25)",
  navbarBg: "linear-gradient(135deg, #030e08 0%, #0a3d25 50%, #0d6b42 100%)",
  inputBg: "#181c19",
  tableHeaderBg: "#181c19",
  statBg: "#181c19",
  codeBg: "#181c19",
  shadowXs: "0 1px 2px rgba(0,0,0,0.2)",
  shadowSm: "0 2px 8px rgba(0,0,0,0.25)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.3)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.35)",
  shadowXl: "0 16px 48px rgba(0,0,0,0.4)",
  shadowGlow: "0 0 24px rgba(52,211,153,0.06)",
  radiusXs: "4px",
  radiusSm: "6px",
  radiusMd: "8px",
  radiusLg: "12px",
  radiusXl: "16px",
  radiusFull: "9999px",
  glassBg: "rgba(255,255,255,0.03)",
  glassBorder: "rgba(255,255,255,0.06)",
  glassBlur: "blur(20px) saturate(1.3)",
  accent: "#34d399",
  accentLight: "#0a241a",
  accentDark: "#0a6b42",
  accentGradient: "linear-gradient(135deg, #030e08 0%, #0a3d25 50%, #0d6b42 100%)",
  accentGlow: "0 0 24px rgba(52,211,153,0.08)",
  success: "#34d399",
  successLight: "#0a241a",
  warning: "#fbbf24",
  warningLight: "#241c06",
  error: "#f87171",
  errorLight: "#240e0e",
  info: "#60a5fa",
  infoLight: "#0a1a3a",
  gold: "#d4a017",
  goldLight: "#241c06",
  skeleton: "#1a1e1b",
};

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  colors: ThemeColors;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggle: () => {},
  colors: light,
  tokens: TOKENS,
});

const STORAGE_KEY = "atb_theme_dark";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "false"); } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark)); } catch {}
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    const dirs: Record<string, string> = { fr: "ltr", en: "ltr", ar: "rtl" };
    const setDir = (lng: string) => document.documentElement.setAttribute("dir", dirs[lng] || "ltr");
    setDir(i18n.language);
    i18n.on("languageChanged", setDir);
    return () => { i18n.off("languageChanged", setDir); };
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev: boolean) => !prev);
  }, []);

  const colors = isDark ? dark : light;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, colors, tokens: TOKENS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
