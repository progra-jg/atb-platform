import { type CSSProperties, type ReactNode } from "react";

const shimmer: CSSProperties = {
  background: "var(--skeleton-shimmer)",
  backgroundSize: "200% 100%",
  animation: "shimmerSkeleton 1.5s ease-in-out infinite",
  borderRadius: "var(--radius-sm)",
};

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  height?: number;
}

export function SkeletonText({ lines = 1, width, height = 14 }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ ...shimmer, width: width ?? (i === lines - 1 && lines > 1 ? "60%" : "100%"), height }} />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  height?: number;
  children?: ReactNode;
}

export function SkeletonCard({ height = 160, children }: SkeletonCardProps) {
  return (
    <div aria-hidden="true" style={{
      ...shimmer, height, width: "100%",
      borderRadius: "var(--radius-lg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <div aria-hidden="true" style={{ ...shimmer, width: size, height: size, borderRadius: "50%", flexShrink: 0 }} />;
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ ...shimmer, height: 14, width: "70%" }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, paddingTop: 10, borderTop: "1px solid var(--color-border-light)" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{ ...shimmer, height: 12, width: c === 0 ? "85%" : "60%" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div aria-hidden="true" style={{
      padding: 20, borderRadius: "var(--radius-lg)",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border-light)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ ...shimmer, width: 28, height: 28, borderRadius: 8 }} />
      <div style={{ ...shimmer, width: "50%", height: 24 }} />
      <div style={{ ...shimmer, width: "70%", height: 12 }} />
    </div>
  );
}
