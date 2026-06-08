import React from "react";
import { useTheme } from "../../context/ThemeContext";

function Pulse({ style }: { style?: React.CSSProperties }) {
  const { colors } = useTheme();
  return (
    <div style={{
      background: colors.surface,
      borderRadius: 8, overflow: "hidden",
      animation: "pulse 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

function Bar({ width = "60%", height = 14, mb = 0 }: { width?: string; height?: number; mb?: number }) {
  return <Pulse style={{ width, height, marginBottom: mb }} />;
}

const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.15; }
}`;

export function HeroSkeleton() {
  return (
    <div style={{ height: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
      <style>{pulseKeyframes}</style>
      <Bar width="180px" height={10} mb={8} />
      <Bar width="clamp(280px, 50%, 480px)" height={36} mb={4} />
      <Bar width="clamp(240px, 40%, 400px)" height={14} mb={4} />
      <Bar width="clamp(200px, 30%, 320px)" height={14} />
      <div style={{ height: 16 }} />
      <div style={{ display: "flex", gap: 12 }}>
        <Pulse style={{ width: 140, height: 44, borderRadius: 10 }} />
        <Pulse style={{ width: 160, height: 44, borderRadius: 10 }} />
      </div>
    </div>
  );
}

export function FeaturesSkeleton() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
      <style>{pulseKeyframes}</style>
      <Bar width="clamp(240px, 40%, 380px)" height={26} mb={12} />
      <Bar width="clamp(260px, 50%, 460px)" height={14} mb={48} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ padding: 28, borderRadius: 16, background: "transparent" }}>
            <Pulse style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 16 }} />
            <Bar width="70%" height={16} mb={8} />
            <Bar width="100%" height={12} mb={4} />
            <Bar width="90%" height={12} mb={4} />
            <Bar width="60%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
      <style>{pulseKeyframes}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ textAlign: "center", padding: 20 }}>
            <Pulse style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 12px" }} />
            <Bar width="80px" height={28} mb={4} />
            <Bar width="100px" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSkeleton() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <style>{pulseKeyframes}</style>
      <Bar width="160px" height={10} mb={12} />
      <Bar width="clamp(240px, 50%, 400px)" height={26} mb={48} />
      <div style={{ padding: "32px 28px", borderRadius: 20, border: "1px solid transparent", background: "transparent" }}>
        <Bar width="100%" height={14} mb={8} />
        <Bar width="95%" height={14} mb={8} />
        <Bar width="80%" height={14} mb={24} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Pulse style={{ width: 40, height: 40, borderRadius: "50%" }} />
          <div>
            <Bar width="120px" height={14} mb={4} />
            <Bar width="160px" height={11} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PricingSkeleton() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
      <style>{pulseKeyframes}</style>
      <Bar width="clamp(200px, 30%, 300px)" height={26} mb={48} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: 32, borderRadius: 16 }}>
            <Bar width="60%" height={16} mb={4} />
            <Bar width="40%" height={12} mb={24} />
            <Bar width="100px" height={32} mb={24} />
            {[1, 2, 3].map(j => (
              <Bar key={j} width={`${70 + j * 10}%`} height={12} mb={8} />
            ))}
            <Pulse style={{ width: "100%", height: 44, borderRadius: 10, marginTop: 24 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
      <style>{pulseKeyframes}</style>
      <Bar width="clamp(240px, 40%, 360px)" height={26} mb={48} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <React.Fragment key={i}>
            <Pulse style={{ height: 16, borderRadius: 4 }} />
            <Pulse style={{ height: 16, borderRadius: 4 }} />
            <Pulse style={{ height: 16, borderRadius: 4 }} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function SectionSkeleton() {
  const { colors } = useTheme();
  return (
    <div style={{ height: 500, background: colors.surface, display: "flex", alignItems: "center", justifyContent: "center" }} role="status" aria-label="Loading section">
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `3px solid ${colors.borderLight}`,
        borderTopColor: colors.accent,
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}
