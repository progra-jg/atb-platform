import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { LotCompletenessResult } from "../utils/scoring";
import { Info, CheckCircle, XCircle, CaretDown } from "@phosphor-icons/react";

interface CompletenessGaugeProps {
  result: LotCompletenessResult;
  size?: "sm" | "md";
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{
      width: 60, height: 5, borderRadius: 3,
      background: "rgba(0,0,0,0.06)", overflow: "hidden", flexShrink: 0,
    }}>
      <motion.div
        style={{ height: "100%", borderRadius: 3, background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export default function CompletenessGauge({ result, size = "md" }: CompletenessGaugeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const color = result.score >= 90 ? colors.success : result.score >= 60 ? colors.warning : colors.error;
  const label = result.score >= 90
    ? t("completenessGauge.complete")
    : result.score >= 60
    ? t("completenessGauge.incomplete")
    : t("completenessGauge.missing");

  if (size === "sm") {
    return (
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "2px 8px", borderRadius: 6,
          background: `${color}18`, cursor: "pointer",
          fontSize: 10, fontWeight: 600, color,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${color}28`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}18`; }}
      >
        <MiniBar pct={result.score} color={color} />
        <span>{result.score}%</span>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                background: colors.surface, borderRadius: 8,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadowMd, padding: "6px 10px",
                zIndex: 10, minWidth: 140, fontSize: 10, color: colors.textSecondary,
              }}
            >
              <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4, fontSize: 11 }}>
                {t("completenessGauge.title")}: {result.score}%
              </div>
              <div style={{ marginBottom: 2 }}>
                {result.filled}/{result.total} {t("completenessGauge.fields")}
              </div>
              {result.missing.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontWeight: 500, color: colors.error, marginBottom: 2, fontSize: 9 }}>
                    {t("completenessGauge.missing")}:
                  </div>
                  {result.missing.map((m) => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, padding: "1px 0" }}>
                      <XCircle size={8} color={colors.error} />
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        padding: "10px 14px", borderRadius: 10,
        background: colors.surface, border: `1.5px solid ${color}20`,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
            <motion.circle
              cx="24" cy="24" r="18" fill="none"
              stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(result.score / 100) * 113.1} 113.1`}
              initial={{ strokeDashoffset: 113.1 }}
              animate={{ strokeDashoffset: 113.1 - (result.score / 100) * 113.1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{result.score}%</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Info size={11} color={color} />
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{t("completenessGauge.title")}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color, padding: "1px 6px", borderRadius: 4, background: `${color}12` }}>
              {label}
            </span>
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>
            {result.filled}/{result.total} {t("completenessGauge.fields")} {t("completenessGauge.filled").toLowerCase()}
            {result.missing.length > 0 && (
              <span style={{ color: colors.error }}> — {result.missing.length} {t("completenessGauge.missing").toLowerCase()}</span>
            )}
          </div>
        </div>
      </div>
      {result.missing.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 3 }}>
          {result.missing.map((m) => (
            <span key={m} style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 4,
              background: `${colors.error}10`, color: colors.error,
              border: `0.5px solid ${colors.error}20`,
            }}>
              <XCircle size={7} style={{ verticalAlign: "middle", marginRight: 2 }} />
              {m}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
