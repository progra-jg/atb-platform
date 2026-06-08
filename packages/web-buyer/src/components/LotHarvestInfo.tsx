import React from "react";
import { CalendarBlank, MapPin, Star, Sun } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import Card, { CardHeader } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";
import type { LotHarvest } from "../types";

interface LotHarvestInfoProps {
  harvest: LotHarvest;
}

export default function LotHarvestInfo({ harvest }: LotHarvestInfoProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const items: { icon: React.ReactNode; labelKey: string; value: string }[] = [];
  if (harvest.date) items.push({ icon: <CalendarBlank size={15} weight="fill" />, labelKey: "detail.harvestDate", value: harvest.date });
  if (harvest.location) items.push({ icon: <MapPin size={15} weight="fill" />, labelKey: "detail.harvestLocation", value: harvest.location });
  if (harvest.year) items.push({ icon: <CalendarBlank size={15} weight="fill" />, labelKey: "detail.harvestYear", value: harvest.year });
  if (harvest.qualityGrade) items.push({ icon: <Star size={15} weight="fill" />, labelKey: "detail.qualityGrade", value: harvest.qualityGrade });
  if (harvest.conditions) items.push({ icon: <Sun size={15} weight="fill" />, labelKey: "detail.harvestConditions", value: harvest.conditions });

  return (
    <Card variant="premium" style={{ padding: 16 }}>
      <CardHeader icon={<CalendarBlank size={16} />} title={t("detail.harvest")} />
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: `${colors.accent}14`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.accent }}>
              {item.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: colors.textMuted, marginBottom: 1 }}>{t(item.labelKey)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
