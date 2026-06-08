import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import i18n from "../i18n";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import Badge from "../components/Badge";
import { ArrowLeft, XCircle } from "@phosphor-icons/react";
import { useCompare } from "../context/CompareContext";
import { formatNumber } from "../utils/format";

const LABEL_KEYS = ["compare.culture", "compare.origin", "compare.region", "compare.qty", "compare.certification", "compare.status", "compare.price", "compare.producer", "compare.trustScore", "compare.date"];

function rowValue(lot: any, key: string): string {
  switch (key) {
    case "compare.culture": return tCrop(lot.culture);
    case "compare.origin": return lot.origine;
    case "compare.region": return lot.region;
    case "compare.qty": return lot.quantite;
    case "compare.certification": return lot.certification;
    case "compare.status": return String(i18n.t("lotStatus." + lot.statut, lot.statut));
    case "compare.price": return formatNumber(lot.prix);
    case "compare.producer": return lot.cooperative || lot.producteur || "—";
    case "compare.trustScore": {
      const inferred = Math.round(
        (lot.note ?? 50) * 0.4 +
        (lot.certification ? 30 : 0) +
        (lot.statut === "Disponible" ? 15 : 0) +
        (lot.phone ? 15 : 0)
      );
      return `${inferred}/100`;
    }
    case "compare.date": return lot.date;
    default: return "—";
  }
}

function certVariant(cert: string): "success" | "info" | "warning" {
  if (cert === "Bio") return "success";
  if (cert === "EUDR") return "info";
  return "warning";
}

export default function CompareLots() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const { compareList, removeFromCompare } = useCompare();

  const ids = params.get("ids")?.split(",") || [];
  const lots = compareList.filter((l: any) => ids.includes(l.id));

  if (lots.length === 0) {
    return (
      <FadeIn delay={0.05}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <XCircle size={48} style={{ marginBottom: 12, opacity: 0.4, color: colors.textMuted }} />
          <div style={{ fontWeight: 600, fontSize: 16, color: colors.text }}>{t("compare.empty")}</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{t("compare.emptyDesc")}</div>
          <button onClick={() => navigate("/lots")} style={{
            marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none",
            background: colors.accentGradient,
            color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13,
          }}>{t("compare.viewLots")}</button>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.05}>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("nav.lots"), path: "/lots" },
          { label: t("compare.title") },
        ]} />
        <PageTitle title={t("compare.title")} subtitle={t("compare.subtitle", { count: lots.length })} />

        <div style={{ overflowX: "auto", borderRadius: 14, border: `1.5px solid ${colors.border}`, background: colors.surface, boxShadow: colors.shadowMd }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: isMobile ? 12 : 13 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted, fontSize: 11, borderBottom: `1px solid ${colors.border}`, minWidth: 110 }}>
                  {t("compare.criterion")}
                </th>
                {lots.map((lot: any, i: number) => (
                  <th key={lot.id} style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: colors.text, borderBottom: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.borderLight}`, minWidth: 140, background: i === 0 ? colors.accent + "08" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: i === 0 ? colors.accent : colors.text }}>{tCrop(lot.culture)}</span>
                      <button onClick={() => { removeFromCompare(lot.id); if (lots.length <= 1) navigate("/lots"); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: "2px 4px", fontSize: 16, lineHeight: 1, borderRadius: 4, transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.error; e.currentTarget.style.background = colors.errorLight; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.background = "transparent"; }}>×</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LABEL_KEYS.map((labelKey) => (
                <tr key={labelKey}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: colors.textMuted, fontSize: 11, borderBottom: `1px solid ${colors.borderLight}`, background: colors.statBg }}>
                    {t(labelKey)}
                  </td>
                  {lots.map((lot: any, i: number) => {
                    const val = rowValue(lot, labelKey);
                    return (
                        <td key={lot.id + labelKey} style={{ padding: "12px 16px", textAlign: "center", borderBottom: `1px solid ${colors.borderLight}`, borderLeft: `1px solid ${colors.borderLight}`, background: i === 0 ? colors.accent + "05" : "transparent" }}>
                        {labelKey === "compare.certification" ? (
                          <Badge text={val} variant={certVariant(val)} size="sm" />
                        ) : labelKey === "compare.price" ? (
                          <span style={{ fontWeight: 700, color: colors.accent }}>{val} {t("common.currency")}</span>
                        ) : labelKey === "compare.trustScore" ? (
                          (() => {
                            const score = parseInt(val);
                            const c = score >= 85 ? colors.success : score >= 65 ? colors.warning : colors.error;
                            return <span style={{ fontWeight: 700, color: c, background: `${c}18`, padding: "2px 10px", borderRadius: 6, fontSize: 13 }}>{val}</span>;
                          })()
                        ) : (
                          <span style={{ fontWeight: 400, color: colors.text }}>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FadeIn>
  );
}
