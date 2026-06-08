import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, WarningCircle, ShieldWarning, CaretDown, CaretUp } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { formatNumber } from "../utils/format";
import type { ThresholdResult } from "../utils/threshold";

interface ThresholdBadgeProps {
  result: ThresholdResult;
  size?: "sm" | "md";
}

export default function ThresholdBadge({ result, size = "sm" }: ThresholdBadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const color = result.severity === "ok" ? colors.success : result.severity === "warning" ? colors.warning : colors.error;
  const bg = result.severity === "ok" ? `${colors.success}14` : result.severity === "warning" ? `${colors.warning}14` : `${colors.error}14`;
  const icon = result.severity === "ok" ? ShieldCheck : result.severity === "warning" ? WarningCircle : ShieldWarning;

  if (size === "sm") {
    return (
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: bg, color, fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: "none", fontFamily: "inherit" }}
      >
        {React.createElement(icon, { size: 12, weight: "fill" })}
        <span>{result.score}/{result.requiredScore}</span>
        {result.isLargeLot && <span style={{ opacity: 0.7 }}>·</span>}
        {result.isLargeLot && <span style={{ opacity: 0.7 }}>{formatNumber(result.estimatedLotValue)}</span>}
        {!result.meetsThreshold && <WarningCircle size={10} weight="fill" style={{ color: result.severity === "blocking" ? colors.error : colors.warning }} />}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${result.severity === "ok" ? `${colors.success}30` : result.severity === "warning" ? `${colors.warning}30` : `${colors.error}30`}`, background: bg, overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {React.createElement(icon, { size: 16, weight: "fill" })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{result.isLargeLot ? t("threshold.largeLot") : t("threshold.standardLot")}</div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>{t(result.meetsThreshold ? "threshold.passes" : "threshold.fails")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{result.score}</div>
          <div style={{ fontSize: 9, color: colors.textMuted }}>/ {result.requiredScore}</div>
        </div>
        <div style={{ color: colors.textMuted }}>{expanded ? <CaretUp size={12} /> : <CaretDown size={12} />}</div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ padding: "0 12px 10px" }}>
            <div style={{ height: 1, background: `${color}20`, marginBottom: 8 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Row label={t("threshold.completeness")} value={t("threshold.score", { score: Math.round(result.score * 0.3) })} colors={colors} />
              <Row label={t("threshold.lotValue")} value={`${formatNumber(result.estimatedLotValue)} FCFA`} colors={colors} />
              <Row label={t("threshold.threshold")} value={result.isLargeLot ? t("threshold.high") : t("threshold.standard")} colors={colors} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: colors.textMuted }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{value}</span>
    </div>
  );
}
