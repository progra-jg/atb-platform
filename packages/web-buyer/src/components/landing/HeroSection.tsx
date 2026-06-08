import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import MagneticButton from "./MagneticButton";
import Badge from "../Badge";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { alphaColor } from "./utils";

interface HeroSectionProps {
  scrollY: number;
  onRegister: () => void;
  onExplore: () => void;
}

interface Point { x: number; y: number }

const NODE_POSITIONS: Point[] = [
  { x: 20, y: 20 }, { x: 75, y: 15 }, { x: 15, y: 60 }, { x: 80, y: 65 },
  { x: 50, y: 10 }, { x: 25, y: 80 }, { x: 70, y: 80 }, { x: 50, y: 55 },
];

const NODE_PAIRS: [Point, Point][] = [
  [NODE_POSITIONS[0], NODE_POSITIONS[1]],
  [NODE_POSITIONS[2], NODE_POSITIONS[3]],
  [NODE_POSITIONS[4], NODE_POSITIONS[5]],
  [NODE_POSITIONS[6], NODE_POSITIONS[7]],
];

const NODE_DELAYS = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8];

const RISE_PARTICLES = [
  { x: 10, drift: 20, dur: 10, delay: 0 },
  { x: 25, drift: -15, dur: 12, delay: 2 },
  { x: 45, drift: 25, dur: 9, delay: 5 },
  { x: 60, drift: -20, dur: 11, delay: 1 },
  { x: 78, drift: 18, dur: 13, delay: 4 },
  { x: 90, drift: -10, dur: 10, delay: 3 },
  { x: 35, drift: 30, dur: 14, delay: 6 },
  { x: 55, drift: -25, dur: 8, delay: 2.5 },
];

function getConnectorStyle(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    left: `${from.x}%`,
    top: `${from.y}%`,
    width: `${length}%`,
    height: 1,
    transformOrigin: "0 50%" as const,
    transform: `rotate(${angle}deg)`,
  };
}

export default function HeroSection({ scrollY, onRegister, onExplore }: HeroSectionProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const nodeColor = isDark ? `${colors.accent}88` : `${colors.accent}88`;
  const linkColor = isDark ? `${colors.accent}20` : `${colors.accent}18`;

  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroY = scrollY * 0.25;

  const floatingPulse = (dur: number, delay = 0) =>
    reducedMotion ? {} : {
      animate: { y: [0, -24, 0], scale: [1, 1.04, 1] },
      transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.5, 1], delay },
    };

  const orbPulse = (dur: number, delay = "") =>
    reducedMotion ? "none" : `pulseGlow ${dur}s ease-in-out infinite ${delay}`;

  return (
    <section id="main-content" style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", padding: "80px 24px 40px",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: [
          `radial-gradient(ellipse 85% 55% at 50% -15%, ${colors.accent}22 0%, transparent 60%)`,
          `radial-gradient(ellipse 60% 50% at 80% 75%, ${colors.gold}12 0%, transparent 55%)`,
          `radial-gradient(ellipse 50% 60% at 15% 80%, ${colors.accentLight} 0%, transparent 50%)`,
          `radial-gradient(ellipse 40% 40% at 70% 20%, ${colors.accent}10 0%, transparent 50%)`,
          `radial-gradient(ellipse 35% 35% at 25% 60%, ${colors.gold}08 0%, transparent 45%)`,
          colors.bg,
        ].join(", "),
      }} />

      <motion.div
        {...floatingPulse(10)}
        aria-hidden="true"
        style={{
          position: "absolute", width: "50vmax", height: "50vmax", borderRadius: "50%",
          top: "5%", left: "-15%",
          background: `radial-gradient(circle, ${colors.accent}08 0%, transparent 65%)`,
          animation: orbPulse(8),
          pointerEvents: "none",
          willChange: "transform, box-shadow",
          transform: `translateY(${scrollY * 0.08}px)`,
        }} />
      <motion.div
        {...floatingPulse(12, 3)}
        aria-hidden="true"
        style={{
          position: "absolute", width: "40vmax", height: "40vmax", borderRadius: "50%",
          bottom: "5%", right: "-10%",
          background: `radial-gradient(circle, ${colors.gold}06 0%, transparent 60%)`,
          animation: orbPulse(12, "3s"),
          pointerEvents: "none",
          willChange: "transform, box-shadow",
          transform: `translateY(${scrollY * -0.05}px)`,
        }} />
      <motion.div
        {...floatingPulse(14, 1)}
        aria-hidden="true"
        style={{
          position: "absolute", width: "30vmax", height: "30vmax", borderRadius: "50%",
          top: "50%", left: "50%",
          background: `radial-gradient(circle, ${colors.accent}06 0%, transparent 55%)`,
          pointerEvents: "none",
          willChange: "transform",
          transform: `translate(-50%, -50%) translateY(${scrollY * -0.03}px)`,
        }} />

      {!reducedMotion && (
        <div aria-hidden="true"
          style={{
            position: "absolute", width: "30vmax", height: "30vmax",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            willChange: "transform",
          }}>
          <div style={{
            position: "absolute", inset: "-30%", borderRadius: "50%",
            background: `conic-gradient(from 0deg, transparent 0deg, ${colors.accent}06 10deg, ${colors.accent}10 20deg, ${colors.gold}06 30deg, transparent 40deg)`,
            mixBlendMode: "screen",
            willChange: "transform",
            animation: "sentinelRotate 8s linear infinite",
          }} />
        </div>
      )}

      {!reducedMotion && NODE_PAIRS.map(([from, to], i) => {
        const style = getConnectorStyle(from, to);
        return (
          <div key={`link-${i}`} aria-hidden="true" style={{
            position: "absolute",
            background: `linear-gradient(90deg, transparent, ${linkColor}, transparent)`,
            opacity: 0.06,
            pointerEvents: "none",
            willChange: "transform, opacity",
            animation: `chainLink ${3 + i * 0.5}s ease-in-out ${i * 1.2}s infinite`,
            ...style,
          }} />
        );
      })}

      {NODE_POSITIONS.map((pos, i) => (
        <div key={`node-${i}`} aria-hidden="true" style={{
          position: "absolute",
          width: 5, height: 5, borderRadius: "50%",
          background: nodeColor,
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          pointerEvents: "none",
          willChange: "transform, box-shadow",
          ...(reducedMotion ? {} : {
            animation: `nodePulse ${3 + (i % 4) * 0.5}s ease-in-out ${NODE_DELAYS[i]}s infinite`,
          }),
        }} />
      ))}

      {!reducedMotion && RISE_PARTICLES.map((p, i) => (
        <div key={`rise-${i}`} aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: `${p.x}%`,
            width: 3,
            height: 10,
            borderRadius: "50% 50% 2px 2px",
            background: `linear-gradient(to top, ${colors.gold}, ${colors.gold}88)`,
            pointerEvents: "none",
            willChange: "transform, opacity, filter",
            animation: [
              `valueRise ${p.dur}s ease-in-out ${p.delay}s infinite`,
              `valueGlow ${p.dur * 0.3}s ease-in-out ${p.delay}s infinite`,
            ].join(", "),
            "--drift": `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}

      <motion.div style={{
        textAlign: "center", maxWidth: 800, position: "relative", zIndex: 1,
        opacity: heroOpacity,
        ...(!reducedMotion ? { transform: `translateY(${heroY}px)` } : {}),
      }}>
        <div style={{ marginBottom: 20 }}>
          <Badge text={t("landing.badge")} variant="success" size="md" pill />
        </div>
        <h1 style={{
          fontSize: "clamp(34px, 7vw, 68px)", fontWeight: 800, lineHeight: 1.08,
          margin: "0 0 16px", letterSpacing: "-1.8px",
          color: colors.text,
        }}>
          {t("landing.heroTitle")}
        </h1>
        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)", color: colors.textMuted, lineHeight: 1.65,
          margin: "0 auto 32px", maxWidth: 600,
        }}>
          {t("landing.heroSubtitle")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <MagneticButton onClick={onRegister}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12, border: "none",
              background: colors.accentGradient,
              color: "#fff",
              fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 20px ${colors.accent}44`,
              fontFamily: "inherit",
            }}>
            {t("landing.cta")} <ArrowRight size={18} weight="bold" />
          </MagneticButton>
          <MagneticButton onClick={onExplore}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12,
              border: `1.5px solid ${alphaColor(isDark, 0.15)}`,
              background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.75),
              fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
              backdropFilter: "blur(12px)",
            }}>
            {t("landing.explore")} <MapPin size={16} />
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  );
}
