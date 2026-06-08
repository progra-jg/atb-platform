import React, { useState, type ReactNode, type KeyboardEvent } from "react";
import { useTheme } from "../../context/ThemeContext";

interface StatCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
  sub?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function StatCard({
  icon: Icon, value, label, sub, color: accentColor,
  trend, onClick, style: externalStyle,
}: StatCardProps) {
  const { colors, tokens } = useTheme();
  const [hover, setHover] = useState(false);
  const c = accentColor || colors.accent;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}
      style={{
        background: colors.surface,
        borderRadius: colors.radiusLg,
        padding: `${tokens.space.xl} ${tokens.space.xxl}`,
        boxShadow: hover ? colors.shadowMd : colors.shadowSm,
        border: `1px solid ${hover ? `${c}44` : colors.borderLight}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        position: "relative",
        overflow: "hidden",
        ...externalStyle,
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: `radial-gradient(circle, ${c}10 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 14, position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${c}08`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${c}15`,
        }}>
          <Icon size={22} color={c} weight="fill" aria-hidden="true" />
        </div>
        {sub && (
          <span style={{
            fontSize: 10, color: c, fontWeight: 600,
            background: `${c}08`, padding: "2px 10px",
            borderRadius: 20, border: `1px solid ${c}15`,
          }}>{sub}</span>
        )}
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trend === "up" ? colors.success : trend === "down" ? colors.error : colors.textMuted,
          }}
            aria-label={trend === "up" ? "Upward trend" : trend === "down" ? "Downward trend" : "Stable trend"}
          >
            {trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192"}
          </span>
        )}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, color: colors.text,
        marginBottom: 2, letterSpacing: "-0.5px",
        lineHeight: 1.15,
      }}>{value}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
