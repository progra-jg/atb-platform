import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { WeatherForecast } from "../../types/weather";
import { useTheme } from "../../context/ThemeContext";
import { Database } from "@phosphor-icons/react";

const WMO_ICONS: Record<number, string> = {
  0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️",
  45: "🌫", 48: "🌫",
  51: "🌦", 53: "🌦", 55: "🌦",
  56: "🌧", 57: "🌧",
  61: "🌧", 63: "🌧", 65: "🌧",
  66: "🌧", 67: "🌧",
  71: "🌨", 73: "🌨", 75: "🌨", 77: "🌨",
  80: "🌦", 81: "🌦", 82: "🌧",
  85: "🌨", 86: "🌨",
  95: "⛈", 96: "⛈", 99: "⛈",
};

function weatherIcon(code: number): string {
  return WMO_ICONS[code] ?? "🌡";
}

function severityColor(sev: string, colors: Record<string, string>): string {
  switch (sev) {
    case "extreme": return colors.error;
    case "high": return "#d32f2f";
    case "moderate": return colors.warning;
    default: return colors.success;
  }
}

interface WeekForecastProps {
  forecasts: WeatherForecast[];
  source: string;
}

const WeekForecast: React.FC<WeekForecastProps> = ({ forecasts, source }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const max = Math.max(...forecasts.map((f) => f.tempMax));
    const min = Math.min(...forecasts.map((f) => f.tempMin));
    const totalPrecip = forecasts.reduce((s, f) => s + f.precipitation, 0);
    const avgWind = forecasts.reduce((s, f) => s + f.windSpeed, 0) / forecasts.length;
    return { max, min, totalPrecip, avgWind: Math.round(avgWind * 10) / 10 };
  }, [forecasts]);

  const dayLabelFn = (dateStr: string, i: number): string => {
    if (i === 0) return t("weatherInsights.today");
    if (i === 1) return t("weatherInsights.tomorrow");
    const d = new Date(dateStr + "T12:00:00");
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    return t(`weatherInsights.dayShort.${days[d.getDay()]}`);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1.5px solid ${colors.border}`,
        background: colors.surface,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${colors.borderLight}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>
          {t("weatherInsights.forecast7days")}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: colors.textMuted }}>
          {source === "mock" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Database size={10} />
              {t("weatherInsights.estimated")}
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              {t("weatherInsights.live")}
            </span>
          )}
          <span>• {t("weatherInsights.max")} {stats.max}° {t("weatherInsights.min")} {stats.min}° • {stats.totalPrecip.toFixed(0)}{t("weatherInsights.mm")}</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 0,
        }}
      >
        {forecasts.map((day, i) => {
          const avgTemp = Math.round((day.tempMin + day.tempMax) / 2);
          return (
            <div
              key={day.date}
              style={{
                padding: "14px 10px",
                textAlign: "center",
                borderRight: i < forecasts.length - 1 ? `1px solid ${colors.borderLight}` : "none",
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                {dayLabelFn(day.date, i)}
              </div>
              <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>
                {weatherIcon(day.weatherCode)}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                {day.weatherLabel === "Données simulées" ? t("weatherInsights.simulated") : day.weatherLabel}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
                {avgTemp}°
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                <span>↑{Math.round(day.tempMax)}°</span>
                <span>↓{Math.round(day.tempMin)}°</span>
              </div>
              <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 4 }}>
                💧 {day.precipitation.toFixed(0)}mm
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>
                🌬 {day.windSpeed.toFixed(0)} km/h
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: "10px 20px",
          borderTop: `1px solid ${colors.borderLight}`,
          fontSize: 11,
          color: colors.textMuted,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <span>🌡 {t("weatherInsights.avg")}: {Math.round(forecasts.reduce((s, f) => s + (f.tempMin + f.tempMax) / 2, 0) / forecasts.length)}°</span>
        <span>💧 {t("weatherInsights.total")}: {stats.totalPrecip.toFixed(0)} mm</span>
        <span>🌬 {t("weatherInsights.windAvg")}: {stats.avgWind} km/h</span>
        {forecasts.some((f) => f.weatherCode >= 95) && <span style={{ color: colors.error }}>⛈ {t("weatherInsights.stormsPossible")}</span>}
        {forecasts.some((f) => f.weatherCode >= 61 && f.weatherCode <= 65) && <span style={{ color: "#3b82f6" }}>🌧 {t("weatherInsights.rainExpected")}</span>}
      </div>
    </div>
  );
};

export default WeekForecast;
