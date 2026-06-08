import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchSampleRequests, SampleRequest } from "../services/sampleRequests";
import FadeIn from "../components/FadeIn";
import Card from "../components/ui/Card";
import { Package, CheckCircle, Clock, XCircle } from "@phosphor-icons/react";
import { formatDate } from "../utils/format";

const statusConfig: Record<string, { icon: any; color: string; bg: string; labelKey: string }> = {
  en_attente: { icon: Clock, color: "#e65100", bg: "#fff3e0", labelKey: "sampleRequests.status.pending" },
  acceptee: { icon: CheckCircle, color: "#059669", bg: "#ecfdf5", labelKey: "sampleRequests.status.accepted" },
  livree: { icon: CheckCircle, color: "#059669", bg: "#ecfdf5", labelKey: "sampleRequests.status.delivered" },
};

export default function SampleRequests() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSampleRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <FadeIn>
      <div>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: "0 0 4px", color: colors.text }}>{t("sampleRequests.title")}</h1>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 24px" }}>{t("sampleRequests.subtitle")}</p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 80, borderRadius: 14, background: `linear-gradient(90deg, ${colors.borderLight} 25%, ${colors.surface} 50%, ${colors.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.2s ease-in-out infinite" }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card variant="bordered" style={{ textAlign: "center", padding: "60px 20px" }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: 12, color: colors.textMuted }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{t("sampleRequests.empty")}</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>{t("sampleRequests.emptyDesc")}</div>
            <button onClick={() => navigate("/lots")} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>{t("sampleRequests.viewLots")}</button>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((r, i) => {
              const cfg = statusConfig[r.statut] || statusConfig.en_attente;
              const StatusIcon = cfg.icon;
              return (
                <div key={r.id} style={{ animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`, border: `1.5px solid ${colors.borderLight}`, borderRadius: 14, background: colors.surface, overflow: "hidden", boxShadow: colors.shadowSm }}>
                  <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{r.lotId}</span>
                        <span style={{ fontSize: 11, color: colors.textMuted }}>{t("sampleRequests.qty")} {r.quantiteDemandee}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: cfg.bg, padding: "3px 10px", borderRadius: 20, width: "fit-content" }}>
                        <StatusIcon size={12} color={cfg.color} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{t(cfg.labelKey)}</span>
                      </div>
                    </div>
                  </div>
                  {r.message && (
                    <div style={{ margin: "0 16px 12px", fontSize: 12, color: colors.textSecondary, background: colors.statBg, padding: "8px 12px", borderRadius: 8, fontStyle: "italic", borderLeft: `3px solid ${colors.accent}` }}>
                      "{r.message}"
                    </div>
                  )}
                  <div style={{ padding: "0 16px 14px", fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} /> {t("sampleRequests.requestedOn")} {formatDate(r.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
