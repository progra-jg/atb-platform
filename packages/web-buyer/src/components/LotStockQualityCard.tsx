import React from "react";
import { useTranslation } from "react-i18next";
import { Cube, Package, Warehouse, Thermometer } from "@phosphor-icons/react";
import Card, { CardHeader } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";
import type { LotStockQuality } from "../types";

interface LotStockQualityCardProps {
  quality: LotStockQuality;
}

export default function LotStockQualityCard({ quality }: LotStockQualityCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const sections: { icon: React.ReactNode; titleKey: string; items: { labelKey: string; value: string }[] }[] = [
    {
      icon: <Cube size={15} weight="fill" />,
      titleKey: "detail.qualityMetrics",
      items: [
        ...(quality.moisture ? [{ labelKey: "detail.moisture", value: quality.moisture }] : []),
        ...(quality.impurities ? [{ labelKey: "detail.impurities", value: quality.impurities }] : []),
        ...(quality.defects ? [{ labelKey: "detail.defects", value: quality.defects }] : []),
      ],
    },
    {
      icon: <Package size={15} weight="fill" />,
      titleKey: "detail.weight",
      items: [
        ...(quality.netWeight ? [{ labelKey: "detail.netWeight", value: quality.netWeight }] : []),
        ...(quality.grossWeight ? [{ labelKey: "detail.grossWeight", value: quality.grossWeight }] : []),
        ...(quality.packaging ? [{ labelKey: "detail.packaging", value: quality.packaging }] : []),
        ...(quality.packagingDate ? [{ labelKey: "detail.packagingDate", value: quality.packagingDate }] : []),
      ],
    },
    {
      icon: <Warehouse size={15} weight="fill" />,
      titleKey: "detail.storage",
      items: [
        ...(quality.storageLocation ? [{ labelKey: "detail.storageLocation", value: quality.storageLocation }] : []),
        ...(quality.storageConditions ? [{ labelKey: "detail.storageConditions", value: quality.storageConditions }] : []),
      ],
    },
  ];

  return (
    <Card variant="premium" style={{ padding: 16 }}>
      <CardHeader icon={<Thermometer size={16} />} title={t("detail.stockQuality")} />
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section, si) => (
          <div key={si}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${colors.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.accent }}>
                {section.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: colors.textMuted }}>{t(section.titleKey)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", paddingLeft: 32 }}>
              {section.items.map((item, ii) => (
                <React.Fragment key={ii}>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{t(item.labelKey)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, textAlign: "right" }}>{item.value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
