import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WeatherAlert } from "../../types/weather";
import { useTheme } from "../../context/ThemeContext";
import { Warning, X, Info } from "@phosphor-icons/react";

const SEVERITY_CONFIG = {
  extreme: { bg: "#7f1d1d", border: "#dc2626", icon: Warning },
  high: { bg: "#450a0a", border: "#ef4444", icon: Warning },
  moderate: { bg: "#451a03", border: "#f59e0b", icon: Info },
  low: { bg: "#052e16", border: "#22c55e", icon: Info },
};

function severityOrder(s: string): number {
  return s === "extreme" ? 0 : s === "high" ? 1 : s === "moderate" ? 2 : 3;
}

interface AlertBannerProps {
  alerts: WeatherAlert[];
  loading?: boolean;
  onAlertClick?: (alert: WeatherAlert) => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, loading, onAlertClick }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const active = alerts
    .filter((a) => !dismissed.has(a.region + a.type))
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

  if (!active.length && !loading) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {loading && (
        <div
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            background: colors.surface,
            border: `1.5px solid ${colors.border}`,
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          {t("weatherInsights.alerts.loading")}
        </div>
      )}
      {active.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
        const Icon = cfg.icon;
        return (
          <div
            key={alert.region + alert.type}
            onClick={() => onAlertClick?.(alert)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onAlertClick) onAlertClick(alert); }}
            style={{
              borderRadius: 12,
              border: `1.5px solid ${cfg.border}33`,
              background: `${colors.surface}`,
              padding: "10px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              boxShadow: `0 0 0 1px ${cfg.border}11`,
              cursor: onAlertClick ? "pointer" : "default",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { if (onAlertClick) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${cfg.border}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={16} color={cfg.border} weight="fill" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>
                  {t(`weatherInsights.alertType.${alert.type}`) ?? alert.title}
                </span>
                <span
                  style={{
                    fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                    background: `${cfg.border}20`, color: cfg.border,
                  }}
                >
                  {t(`weatherInsights.severity.${alert.severity}`)}
                </span>
                <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
                  — {alert.region}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
                {alert.description}
              </p>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.region + alert.type))}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: colors.textMuted, flexShrink: 0,
              }}
              aria-label={t("weatherInsights.alerts.close")}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanner;
