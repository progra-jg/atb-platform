import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
  variant?: "glass" | "solid";
  style?: React.CSSProperties;
}

export default function QuickActionButton({
  icon: Icon, label, onClick, color: accentColor,
  variant = "glass", style: externalStyle,
}: QuickActionButtonProps) {
  const { colors } = useTheme();
  const [hover, setHover] = useState(false);
  const c = accentColor || colors.accent;

  const glassStyles: React.CSSProperties = {
    background: hover ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
    border: `1px solid ${hover ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
    color: "#fff",
  };

  const solidStyles: React.CSSProperties = {
    background: hover ? `${c}dd` : `${c}11`,
    border: `1.5px solid ${hover ? c : `${c}30`}`,
    color: hover ? "#fff" : c,
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "9px 18px", borderRadius: 10,
        fontSize: 12, fontWeight: 600,
        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: variant === "glass" ? "blur(8px)" : "none",
        WebkitBackdropFilter: variant === "glass" ? "blur(8px)" : "none",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        fontFamily: "inherit",
        ...(variant === "glass" ? glassStyles : solidStyles),
        ...externalStyle,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: variant === "glass" ? `${c}30` : `${c}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={13} weight="fill" />
      </div>
      {label}
    </button>
  );
}
