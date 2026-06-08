export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
} as const;

export const radius = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 9999,
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  size: {
    xs: 10, sm: 12, base: 14, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40,
  },
  weight: {
    light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
  },
  lineHeight: { tight: 1.2, base: 1.5, relaxed: 1.7 },
} as const;

export const shadow = {
  xs: "0 1px 2px rgba(0,0,0,0.04)",
  sm: "0 2px 8px rgba(0,0,0,0.06)",
  md: "0 8px 24px rgba(0,0,0,0.08)",
  lg: "0 16px 48px rgba(0,0,0,0.12)",
  xl: "0 24px 64px rgba(0,0,0,0.16)",
  glow: "0 0 20px rgba(27,94,32,0.15)",
  glowLg: "0 0 40px rgba(27,94,32,0.2)",
} as const;

export const shadowDark = {
  xs: "0 1px 2px rgba(0,0,0,0.15)",
  sm: "0 2px 8px rgba(0,0,0,0.25)",
  md: "0 8px 24px rgba(0,0,0,0.35)",
  lg: "0 16px 48px rgba(0,0,0,0.45)",
  xl: "0 24px 64px rgba(0,0,0,0.55)",
  glow: "0 0 20px rgba(129,199,132,0.08)",
  glowLg: "0 0 40px rgba(129,199,132,0.12)",
} as const;

export const breakpoint = {
  sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536,
} as const;

export const transition = {
  fast: "0.15s cubic-bezier(0.4, 0, 0.2, 1)",
  base: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const zIndex = {
  base: 1, dropdown: 100, sticky: 200, navbar: 300, modal: 400, toast: 500, tooltip: 600,
} as const;

export const green = {
  50: "#e8f5e9", 100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784", 400: "#66bb6a",
  500: "#4caf50", 600: "#43a047", 700: "#388e3c", 800: "#2e7d32", 900: "#1b5e20",
  950: "#0d3b11",
} as const;

export const neutral = {
  50: "#fafafa", 100: "#f5f5f5", 200: "#eeeeee", 300: "#e0e0e0", 400: "#bdbdbd",
  500: "#9e9e9e", 600: "#757575", 700: "#616161", 800: "#424242", 900: "#212121",
  950: "#121212",
} as const;
