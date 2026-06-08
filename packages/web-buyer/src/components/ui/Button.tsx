import React, { useState, ReactNode, ElementType } from "react";
import { useTheme } from "../../context/ThemeContext";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "premium";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  as?: ElementType;
  href?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

const VARIANT_NAMES: ButtonVariant[] = ["primary", "secondary", "ghost", "danger", "success", "premium"];

const sizeStyles: Record<ButtonSize, { height: number; px: number; fs: number; gap: number }> = {
  sm: { height: 32, px: 14, fs: 12, gap: 5 },
  md: { height: 40, px: 20, fs: 13, gap: 6 },
  lg: { height: 48, px: 28, fs: 15, gap: 8 },
};

export default function Button({
  children, onClick, variant = "primary", size = "md",
  icon, disabled, loading, fullWidth, as: Tag = "button", href, target, type = "button",
  style: externalStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const vStyles: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string; glow: string }> = {
    primary: { bg: colors.accent, color: "#fff", border: "transparent", hoverBg: colors.accentDark, glow: colors.accentGlow },
    secondary: { bg: "transparent", color: "", border: "", hoverBg: "", glow: "" },
    ghost: { bg: "transparent", color: "", border: "transparent", hoverBg: "", glow: "" },
    danger: { bg: colors.error, color: "#fff", border: "transparent", hoverBg: colors.error, glow: `0 0 20px ${colors.error}26` },
    success: { bg: colors.success, color: "#fff", border: "transparent", hoverBg: colors.success, glow: `0 0 20px ${colors.success}26` },
    premium: { bg: "", color: "#fff", border: "transparent", hoverBg: "", glow: "" },
  };

  const ss = sizeStyles[size];
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isPremium = variant === "premium";
  const vs = vStyles[variant];
  const resolvedBg = isSecondary
    ? (isHovered ? colors.surfaceHover : "transparent")
    : isGhost
      ? (isHovered ? colors.surfaceHover : "transparent")
      : isPremium
        ? colors.accentGradient
        : vs.bg;
  const resolvedColor = isSecondary ? colors.text : isGhost ? colors.textSecondary : vs.color;
  const resolvedBorder = isSecondary ? colors.borderLight : isGhost ? "transparent" : vs.border;

  const props = {
    onClick,
    disabled: disabled || loading,
    type: Tag === "button" ? type : undefined,
    href: Tag === "a" ? href : undefined,
    target: Tag === "a" ? target : undefined,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => { setIsHovered(false); setIsPressed(false); },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: ss.gap,
      height: ss.height,
      padding: `0 ${ss.px}px`,
      fontSize: ss.fs,
      fontWeight: 600,
      fontFamily: "inherit",
      lineHeight: 1,
      letterSpacing: isPremium ? "0.01em" : "normal",
      borderRadius: colors.radiusSm,
      background: resolvedBg,
      color: resolvedColor,
      border: `1.5px solid ${resolvedBorder}`,
      boxShadow: isHovered && !isSecondary && !isGhost ? (isPremium ? `0 4px 16px ${colors.accent}40` : vs.glow) : "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? "100%" : undefined,
      transform: isPressed ? "scale(0.97)" : isHovered ? "translateY(-1px)" : "translateY(0)",
      transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      textDecoration: "none",
      whiteSpace: "nowrap",
      userSelect: "none",
      position: "relative",
      overflow: "hidden",
      ...externalStyle,
    } as React.CSSProperties,
  };

  return (
    <Tag {...props}>
      {isPremium && isHovered && !loading && (
        <span style={{
          position: "absolute", inset: 0, background: "rgba(255,255,255,0.1)",
          borderRadius: "inherit", animation: "fadeIn 0.2s ease",
        }} />
      )}
      {loading ? (
        <span style={{
          width: ss.fs, height: ss.fs, borderRadius: "50%", display: "inline-block",
          border: "2px solid currentColor", borderTopColor: "transparent",
          animation: "spin 0.6s linear infinite",
        }} />
      ) : icon ? <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span> : null}
      {children}
    </Tag>
  );
}
