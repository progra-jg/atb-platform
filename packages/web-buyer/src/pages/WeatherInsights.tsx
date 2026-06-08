import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import FadeIn from "../components/FadeIn";
import { ResponsiveContainer } from "../components/ResponsiveContainer";
import { Spinner, MapPin, Bell } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useWeather } from "../hooks/useWeather";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchLots } from "../services/lots";
import { fetchAlerts as fetchUserAlerts } from "../services/alertsV2";
import type { WeatherAlert } from "../types/weather";
import RegionCard from "../components/weather/RegionCard";
import WeekForecast from "../components/weather/WeekForecast";
import AlertBanner from "../components/weather/AlertBanner";
import CropAdvisory from "../components/weather/CropAdvisory";
import HistoryChart from "../components/weather/HistoryChart";
import BeninMap from "../components/weather/BeninMap";

const WeatherInsights: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    regions, alerts, selectedRegion, selectedForecast,
    advisory, loading, alertLoading, advisoryLoading,
    selectRegion, loadAdvisory,
  } = useWeather();

  const [showHistory, setShowHistory] = useState(false);
  const [lotCounts, setLotCounts] = useState<Record<string, number>>({});
  const [userAlertCount, setUserAlertCount] = useState(0);

  useEffect(() => {
    if (!selectedRegion) { setLotCounts({}); return; }
    fetchLots({ region: selectedRegion }).then((lots) => {
      const counts: Record<string, number> = {};
      for (const lot of lots) {
        counts[lot.culture] = (counts[lot.culture] || 0) + 1;
      }
      setLotCounts(counts);
    }).catch(() => setLotCounts({}));
  }, [selectedRegion]);

  useEffect(() => {
    fetchUserAlerts().then((ua) => {
      setUserAlertCount(ua.filter((a) => a.active).length);
    }).catch(() => {});
  }, []);

  const handleSelectCrop = useCallback((_crop: string) => {
  }, []);

  const handleAlertClick = useCallback((alert: WeatherAlert) => {
    navigate(`/lots?region=${encodeURIComponent(alert.region)}`);
  }, [navigate]);

  return (
    <FadeIn>
      <div style={{ padding: "24px 0" }}>
        <ResponsiveContainer>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
              {t("weatherInsights.title")}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>
              {t("weatherInsights.subtitle")}
              {!loading && ` — ${t("weatherInsights.departments", { count: regions.length })}`}
            </p>
          </div>

          <AlertBanner alerts={alerts} loading={alertLoading} onAlertClick={handleAlertClick} />

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 24,
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div
              style={isMobile ? {
                width: "100%",
                flexShrink: 0,
              } : {
                position: "sticky",
                top: 20,
                width: 320,
                flexShrink: 0,
                alignSelf: "flex-start",
              }}
            >
              <BeninMap
                regions={regions}
                selectedRegion={selectedRegion}
                onSelectRegion={selectRegion}
                height={420}
              />
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                <MapPin size={12} weight="fill" />
                {t("weatherInsights.map.clickRegion")}
              </div>
              <button
                onClick={() => navigate("/lots")}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1.5px solid ${colors.accent}`,
                  background: colors.accent,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {selectedRegion
                  ? t("weatherInsights.viewLotsInRegion", { region: selectedRegion })
                  : t("weatherInsights.viewLots")}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                  <Spinner size={36} color={colors.accent} weight="bold" />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    {regions.map((region, i) => (
                      <RegionCard
                        key={region.name}
                        region={region}
                        selected={selectedRegion === region.name}
                        index={i}
                        onClick={() => selectRegion(region.name)}
                      />
                    ))}
                  </div>

                  {selectedForecast && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                      <WeekForecast forecasts={selectedForecast.forecast} source={selectedForecast.source} />

                      <CropAdvisory
                        selectedRegion={selectedRegion!}
                        onSelectCrop={handleSelectCrop}
                        onLoadAdvisory={loadAdvisory}
                        loading={advisoryLoading}
                        affectedCrops={regions.find((r) => r.name === selectedRegion)?.affectedCrops}
                        lotCounts={lotCounts}
                      />

                      {advisory && (
                        <div
                          style={{
                            borderRadius: 14,
                            border: `1.5px solid ${colors.border}`,
                            background: colors.surface,
                            padding: 16,
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 10 }}>
                            {advisory.crop} — {advisory.region}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {advisory.advisories.slice(0, 7).map((a) => (
                              <div
                                key={a.date}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  background: a.condition === "favorable" ? colors.successLight : colors.errorLight,
                                  color: a.condition === "favorable" ? colors.success : colors.error,
                                }}
                              >
                                <span style={{ fontWeight: 600, minWidth: 60 }}>{a.date.slice(5)}</span>
                                <span>{a.condition === "favorable" ? "✅" : "⚠️"} {a.condition}</span>
                                <span style={{ color: colors.textMuted }}>— {a.details}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => setShowHistory((p) => !p)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            border: `1.5px solid ${colors.border}`,
                            background: showHistory ? colors.accentLight : colors.surface,
                            color: showHistory ? colors.accent : colors.textSecondary,
                            cursor: "pointer",
                          }}
                        >
                          {showHistory ? t("weatherInsights.hideHistory") : t("weatherInsights.showHistory")}
                        </button>
                      </div>

                      <HistoryChart region={selectedRegion!} visible={showHistory} />
                    </div>
                  )}

                  {advisoryLoading && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: 16,
                        color: colors.textMuted,
                        fontSize: 13,
                      }}
                    >
                      <Spinner size={16} /> {t("weatherInsights.analyzing")}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: `1.5px solid ${colors.border}`,
              background: colors.surface,
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Bell size={20} color={alerts.length > 0 ? colors.warning : colors.textMuted} weight="fill" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>
                  {t("weatherInsights.alertCount", { count: alerts.length + userAlertCount })}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {alerts.length > 0 && (
                    <span>{alerts.slice(0, 2).map((a) => a.region).join(", ")}{alerts.length > 2 && ", ..."}</span>
                  )}
                  {userAlertCount > 0 && (
                    <span>{alerts.length > 0 && " · "}{userAlertCount} utilisateur{alerts.length > 0 && ""}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/alerts")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${colors.border}`,
                background: colors.surfaceElevated,
                color: colors.accent,
                cursor: "pointer",
              }}
            >
              {t("weatherInsights.manageAlerts")}
            </button>
          </div>
        </ResponsiveContainer>
      </div>
    </FadeIn>
  );
};

export default WeatherInsights;
