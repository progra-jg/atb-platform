import React, { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { easing } from "../../lib/motion-variants";

interface CardProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  padding?: string;
  variant?: "default" | "glass" | "gradient" | "bordered" | "premium";
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export default function Card({
  children, onClick, padding,
  variant = "default", hoverable = true,
  style: externalStyle,
}: CardProps) {
  const { colors } = useTheme();
  const [hover, setHover] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: colors.surface,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: hover && hoverable ? colors.shadowMd : colors.shadowSm,
    },
    glass: {
      background: colors.glassBg,
      backdropFilter: colors.glassBlur,
      WebkitBackdropFilter: colors.glassBlur,
      border: `1px solid ${colors.glassBorder}`,
      boxShadow: hover && hoverable ? colors.shadowLg : colors.shadowSm,
    },
    gradient: {
      background: colors.accentGradient,
      border: "none",
      boxShadow: hover && hoverable ? colors.shadowLg : colors.shadowMd,
      color: "#fff",
    },
    bordered: {
      background: "transparent",
      border: `1.5px solid ${colors.border}`,
      boxShadow: "none",
    },
    premium: {
      background: colors.surface,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: hover && hoverable ? colors.shadowLg : colors.shadowSm,
    },
  };

  const s = styles[variant] || styles.default;
  const isPremium = variant === "premium";

  const paddingToken = padding || "24px";

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={hoverable && variant !== "bordered" ? { y: -2, transition: { duration: 0.25, ease: easing } } : undefined}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e as unknown as React.MouseEvent); } } } : {})}
      style={{
        borderRadius: colors.radiusLg,
        padding: paddingToken,
        cursor: onClick ? "pointer" : "default",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
        ...s,
        ...(isPremium && hover && hoverable ? {
          boxShadow: `${colors.shadowLg}, ${colors.accentGlow}`,
          borderColor: colors.accent + "40",
        } : {}),
        ...externalStyle,
      }}
    >
      {isPremium && hover && hoverable && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${colors.accent}50, transparent)`,
          opacity: hover ? 1 : 0,
          transition: "opacity 250ms ease",
        }} />
      )}
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action, icon }: {
  title: ReactNode; subtitle?: string; action?: ReactNode; icon?: ReactNode;
}) {
  const { colors, tokens } = useTheme();
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: tokens.space.lg, gap: tokens.space.md, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: tokens.space.sm, minWidth: 0 }}>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: colors.radiusSm,
            background: colors.accentLight, display: "flex",
            alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: colors.accent,
          }}>
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, color: colors.text,
            margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em",
          }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: colors.textMuted, margin: "2px 0 0", lineHeight: 1.4 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export function CardDivider() {
  const { colors, tokens } = useTheme();
  return <div style={{ height: 1, background: colors.borderLight, margin: `${tokens.space.lg} 0` }} />;
}

export function CardStat({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" | "neutral" }) {
  const { colors } = useTheme();
  const trendColors = { up: colors.success, down: colors.error, neutral: colors.textMuted };
  return (
    <div>
      <div style={{ fontSize: "var(--font-xs)", color: colors.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "var(--font-2xl)", fontWeight: 700, color: colors.text, lineHeight: 1.15, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 6 }}>
        {value}
        {trend && (
          <span style={{ fontSize: "var(--font-sm)", color: trendColors[trend], fontWeight: 600 }}>
            {trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192"}
          </span>
        )}
      </div>
    </div>
  );
}
