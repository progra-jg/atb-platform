import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { RegionWeather } from "../../types/weather";
import { useTheme } from "../../context/ThemeContext";
import { MapPin, Thermometer, Cloud, Drop, Warning, ArrowRight, Database } from "@phosphor-icons/react";

const riskColor = (level: string, colors: any): string => {
  switch (level) {
    case "high": return "#d32f2f";
    case "moderate": return "#ed6c02";
    default: return "#2e7d32";
  }
};

const riskBg = (level: string): string => {
  switch (level) {
    case "high": return "#ffebee";
    case "moderate": return "#fff3e0";
    default: return "#e8f5e9";
  }
};

interface RegionCardProps {
  region: RegionWeather;
  selected: boolean;
  index: number;
  onClick: () => void;
}

const RegionCard: React.FC<RegionCardProps> = ({ region, selected, index, onClick }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      style={{
        background: colors.surface,
        borderRadius: 14,
        border: `1.5px solid ${selected ? colors.accent : colors.border}`,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: selected
          ? "0 0 0 2px rgba(10,110,74,0.15), 0 8px 24px rgba(0,0,0,0.06)"
          : colors.shadowSm,
        animation: `fadeSlideUp 0.4s ease ${index * 0.04}s both`,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = colors.accent;
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = colors.shadowSm;
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} color={colors.textMuted} />
          <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>{region.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: `${riskColor(region.riskLevel, colors)}12`,
            padding: "2px 8px",
            borderRadius: 8,
          }}
        >
          <Thermometer size={14} color={riskColor(region.riskLevel, colors)} />
          <span style={{ fontWeight: 700, fontSize: 18, color: riskColor(region.riskLevel, colors) }}>
            {region.temp}°
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Cloud size={14} color={colors.textMuted} />
        <span style={{ fontSize: 13, color: colors.text }}>{region.condition === "Données simulées" ? t("weatherInsights.simulated") : region.condition}</span>
        {region.source === "mock" && (
          <span
            style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: `${colors.warningLight}50`, color: colors.warning,
              marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 2,
            }}
          >
            <Database size={10} />
            {t("weatherInsights.estimated")}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: colors.textMuted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Drop size={12} />{region.humidity}%
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          💧 {region.rain} mm
        </span>
      </div>

      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          background: riskBg(region.riskLevel),
          color: riskColor(region.riskLevel, colors),
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Warning size={14} weight="fill" />
        <span>{t(`weatherInsights.riskAction.${region.riskLevel}`)}</span>
      </div>

      <div
        onClick={(e) => { e.stopPropagation(); navigate("/lots"); }}
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: colors.accent,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        <span>{t("weatherInsights.viewLots")}</span>
        <ArrowRight size={12} weight="bold" />
      </div>
    </div>
  );
};

export default RegionCard;
