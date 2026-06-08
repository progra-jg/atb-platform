import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Plant, ArrowRight } from "@phosphor-icons/react";

const CROPS = ["Cacao", "Coton", "Maïs", "Manioc", "Anacarde", "Soja", "Riz", "Café", "Ananas", "Banane", "Palmier à huile"];

interface CropAdvisoryProps {
  selectedRegion: string;
  onSelectCrop: (crop: string) => void;
  onLoadAdvisory: (crop: string) => void;
  loading: boolean;
  affectedCrops?: string[];
  lotCounts?: Record<string, number>;
}

const CropAdvisory: React.FC<CropAdvisoryProps> = ({ selectedRegion, onSelectCrop, onLoadAdvisory, loading, affectedCrops, lotCounts }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  const handleSelect = useCallback((crop: string) => {
    setSelectedCrop(crop);
    onSelectCrop(crop);
    onLoadAdvisory(crop);
  }, [onSelectCrop, onLoadAdvisory]);

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1.5px solid ${colors.border}`,
        background: colors.surface,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Plant size={16} color={colors.accent} weight="fill" />
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>
          {t("weatherInsights.cropAdvisory", { region: selectedRegion })}
        </span>
        {loading && <span style={{ fontSize: 11, color: colors.textMuted }}>{t("weatherInsights.analyzing")}</span>}
      </div>
      {affectedCrops && affectedCrops.length > 0 && (
        <div style={{ fontSize: 11, color: colors.warning, marginBottom: 10, fontWeight: 500 }}>
          {t("weatherInsights.cropsAtRisk", { crops: affectedCrops.map((c) => t(`crops.${c}`)).join(", ") })}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CROPS.map((crop) => {
          const atRisk = affectedCrops?.includes(crop);
          return (
            <button
              key={crop}
              onClick={() => {
                if (!loading) handleSelect(crop);
              }}
              disabled={loading}
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                border: `1.5px solid ${selectedCrop === crop ? colors.accent : atRisk ? colors.warning : colors.borderLight}`,
                background: selectedCrop === crop ? colors.accentLight : atRisk ? `${colors.warningLight}40` : "transparent",
                color: selectedCrop === crop ? colors.accent : atRisk ? colors.warning : colors.textSecondary,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {t(`crops.${crop}`)}
              {atRisk && <span style={{ marginLeft: 4 }}>⚠️</span>}
              {lotCounts?.[crop] != null && (
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
                  {lotCounts[crop]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        onClick={() => navigate("/lots")}
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

export default CropAdvisory;
