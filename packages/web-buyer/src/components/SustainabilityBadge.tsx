import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import type { SustainabilityScore } from "../services/sustainability";

interface Props {
  score: SustainabilityScore;
  size?: "sm" | "md";
}

const levelIcons: Record<string, string> = {
  Excellent: "🌟", "Très bien": "✅", Bon: "👍", Moyen: "📊", Faible: "⚠️",
};

export default function SustainabilityBadge({ score, size = "sm" }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isSm = size === "sm";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: isSm ? 28 : 40, height: isSm ? 28 : 40, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${score.color}14`,
        border: `2px solid ${score.color}`,
        fontSize: isSm ? 11 : 16, fontWeight: 700, color: score.color,
        flexShrink: 0,
      }}>
        {score.score}
      </div>
      <div>
        <div style={{ fontSize: isSm ? 10 : 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 3 }}>
          {levelIcons[score.level] || "📊"} {t("sustainability.rse")} {t(`sustainability.levels.${score.level}`)}
        </div>
        <div style={{ fontSize: isSm ? 8 : 10, color: colors.textMuted }}>
          {score.total}/{score.max} pts
        </div>
      </div>
    </div>
  );
}

export function SustainabilityBreakdown({ score }: { score: SustainabilityScore }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <div style={{ background: colors.statBg, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        {levelIcons[score.level] || "📊"} {t("sustainability.score")} : {score.score}/100 · {t(`sustainability.levels.${score.level}`)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {score.breakdown.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>
              <span>{item.label}</span>
              <span style={{ fontWeight: 600, color: item.color }}>+{item.points}/{item.max}</span>
            </div>
            <div style={{ height: 4, background: colors.borderLight, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(item.points / item.max) * 100}%`, height: "100%", background: item.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
