import React, { type KeyboardEvent } from "react";
import { useTheme } from "../context/ThemeContext";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  pill?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string; darkBg: string; darkBorder: string }> = {
  success: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", darkBg: "#064e34", darkBorder: "#05966944" },
  warning: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", darkBg: "#3b2c06", darkBorder: "#d9770644" },
  error: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", darkBg: "#3b1010", darkBorder: "#dc262644" },
  info: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", darkBg: "#0a1a3b", darkBorder: "#2563eb44" },
  neutral: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", darkBg: "#1a1a1a", darkBorder: "#33333344" },
};

function Badge({ text, variant = "neutral", icon, size = "md", pill = true, animated = true, onClick }: BadgeProps) {
  const s = size === "sm" ? { py: "2px", px: "8px", fs: 10 } : { py: "3px", px: "12px", fs: 11 };
  const { isDark } = useTheme();
  const vs = variantStyles[variant];
  const bg = isDark ? vs.darkBg : vs.bg;
  const border = isDark ? vs.darkBorder : vs.border;
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: `${s.py} ${s.px}`, fontSize: s.fs, fontWeight: 600,
        borderRadius: pill ? 9999 : 6,
        background: bg, color: vs.color, border: `1px solid ${border}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: animated ? "badgeEnter 0.3s ease both" : "none",
        lineHeight: 1.4, whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.boxShadow = `0 2px 8px ${border}`; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; } }}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}
    >
      {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      {text}
    </span>
  );
}

export function Tag({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        padding: "3px 10px", fontSize: 10, fontWeight: 500,
        borderRadius: 6,
        background: "#f4f5f7", color: "#6b7280",
        border: "1px solid #e1e4e8",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
        lineHeight: 1.4,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#ecfdf5"; e.currentTarget.style.color = "#0a6e4a"; e.currentTarget.style.borderColor = "#a7f3d0"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f5f7"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "#e1e4e8"; }}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}
    >
      #{text}
    </span>
  );
}

export function StatusDot({ variant = "neutral" }: { variant?: BadgeVariant }) {
  const dotColors: Record<BadgeVariant, string> = {
    success: "#059669", warning: "#d97706", error: "#dc2626", info: "#2563eb", neutral: "#9e9e9e",
  };
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0,
      background: dotColors[variant],
      boxShadow: `0 0 6px ${dotColors[variant]}44`,
    }} />
  );
}

export default Badge;
