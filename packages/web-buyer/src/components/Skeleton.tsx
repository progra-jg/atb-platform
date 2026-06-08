import React from "react";
import { useTheme } from "../context/ThemeContext";

interface SkeletonProps {
  width?: string | number;
  height?: number;
  radius?: string | number;
  variant?: "text" | "circle" | "rect";
  mb?: number;
}

export default function Skeleton({
  width = "100%", height = 16, radius = 6, variant = "text", mb = 0,
}: SkeletonProps) {
  const { colors } = useTheme();
  const isCircle = variant === "circle";
  const finalRadius = isCircle ? "50%" : radius;
  const finalWidth = isCircle ? height : width;
  return (
    <div
      style={{
        width: typeof finalWidth === "number" ? finalWidth : finalWidth,
        height, borderRadius: finalRadius, marginBottom: mb,
        background: `linear-gradient(90deg, ${colors.skeleton} 25%, ${colors.skeleton}80 50%, ${colors.skeleton} 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmerSkeleton 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <div style={{
      background: colors.surface, borderRadius: 12, padding: 20,
      border: `1px solid ${colors.borderLight}`,
    }}>
      <Skeleton width="35%" height={12} mb={12} />
      <Skeleton width="65%" height={18} mb={8} />
      <Skeleton width="80%" height={10} mb={16} />
      <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 12 }}>
        <Skeleton width="40%" height={16} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
      <Skeleton width={32} height={32} radius={8} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={12} mb={4} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={60} height={14} radius={4} />
    </div>
  );
}
