import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CaretDown, SealCheck, ArrowsClockwise,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import type { TrustScoreResult } from "../utils/scoring";

const TIER_META: Record<string, { color: string; light: string; gradient: string }> = {
  platinum: { color: "#48bb78", light: "#48bb7822", gradient: "linear-gradient(135deg, #48bb78, #38a169)" },
  gold: { color: "#f6ad55", light: "#f6ad5522", gradient: "linear-gradient(135deg, #f6ad55, #ed8936)" },
  silver: { color: "#a0aec0", light: "#a0aec022", gradient: "linear-gradient(135deg, #a0aec0, #718096)" },
  bronze: { color: "#cd7f32", light: "#cd7f3222", gradient: "linear-gradient(135deg, #cd7f32, #b8732a)" },
};

interface TrustBadgeProps {
  result: TrustScoreResult;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  onViewDetails?: () => void;
}

function AnimatedRing({ score, color, size }: { score: number; color: string; size: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.2, ease: "easeOut" });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [score, count, rounded]);

  const stroke = Math.max(4, size * 0.07);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (display / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <motion.span
          key={display}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "backOut" }}
          style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
        >
          {display}
        </motion.span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: colors.textSecondary, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: value >= 80 ? color : value >= 50 ? colors.warning : colors.error }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: colors.borderLight, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 2, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function TrustBadge({ result, size = "md", showBreakdown: forceOpen, onViewDetails }: TrustBadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(forceOpen ?? false);

  const dim = size === "sm" ? 44 : size === "md" ? 64 : 88;
  const meta = TIER_META[result.tier] ?? TIER_META.bronze;
  const componentLabels: Record<string, string> = {
    transactionSuccessRate: t("trustBadge.components.transactionSuccessRate"),
    credibilityScore: t("trustBadge.components.credibilityScore"),
    trustIndexScore: t("trustBadge.components.trustIndexScore"),
    dataCompleteness: t("trustBadge.components.dataCompleteness"),
    didVerified: t("trustBadge.components.didVerified"),
    eudrCompliance: t("trustBadge.components.eudrCompliance"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        borderRadius: 12, overflow: "hidden",
        background: colors.surface, border: `1.5px solid ${meta.color}25`,
        transition: "box-shadow 0.2s",
      }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: size === "sm" ? "6px 10px" : size === "md" ? "10px 14px" : "14px 18px",
        cursor: "pointer",
      }}
        onClick={() => setOpen(!open)}
      >
        <AnimatedRing score={result.overall} color={meta.color} size={dim} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "1px 8px", borderRadius: 4,
            background: meta.light, color: meta.color,
            fontSize: size === "sm" ? 8 : 9, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <ShieldCheck size={size === "sm" ? 8 : 10} weight="fill" />
            {t(result.labelKey)}
          </div>
          <div style={{
            fontSize: size === "sm" ? 10 : 12, fontWeight: 600, color: colors.text,
            marginTop: 2,
          }}>
            {t("trustBadge.title")}
          </div>
        </div>
        {!forceOpen && (
          <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <CaretDown size={size === "sm" ? 10 : 12} color={colors.textMuted} />
          </motion.div>
        )}
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ overflow: "hidden" }}
        >
          <div style={{
            padding: size === "sm" ? "0 10px 8px" : "0 14px 12px",
            borderTop: `1px solid ${colors.borderLight}`,
            paddingTop: 8,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {t("trustBadge.breakdown")}
            </div>
            {Object.entries(result.components).map(([key, val]) => (
              <ComponentBar
                key={key}
                label={componentLabels[key] ?? key}
                value={val}
                color={meta.color}
              />
            ))}
            {onViewDetails && (
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                  style={{
                    background: "none", border: "none", color: meta.color,
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", borderRadius: 6,
                  }}
                >
                  <ArrowsClockwise size={10} />
                  {t("trustBadge.viewDetails")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
