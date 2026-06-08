import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { ChartLine, Spinner } from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchWeatherHistory } from "../../services/weather";

interface HistoryDay {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface HistoryChartProps {
  region: string;
  visible: boolean;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ region, visible }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [data, setData] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"temp" | "precip">("temp");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWeatherHistory(region);
        if (!cancelled && res.history) setData(res.history);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [region, visible]);

  if (!visible) return null;

  const chartData = data.slice(-30).map((d) => ({
    date: d.date.slice(5),
    min: Math.round(d.tempMin),
    max: Math.round(d.tempMax),
    precip: Math.round(d.precipitation),
  }));

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1.5px solid ${colors.border}`,
        background: colors.surface,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ChartLine size={16} color={colors.accent} />
          <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>
            {t("weatherInsights.history.title", { region })}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["temp", "precip"] as const).map((tKey) => (
            <button
              key={tKey}
              onClick={() => setTab(tKey)}
              style={{
                padding: "2px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: `1px solid ${tab === tKey ? colors.accent : colors.borderLight}`,
                background: tab === tKey ? colors.accentLight : "transparent",
                color: tab === tKey ? colors.accent : colors.textMuted,
                cursor: "pointer",
              }}
            >
              {tKey === "temp" ? t("weatherInsights.history.temp") : t("weatherInsights.history.precip")}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Spinner size={24} color={colors.accent} weight="bold" />
        </div>
      )}

      {!loading && chartData.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, fontSize: 13, color: colors.textMuted }}>
          {t("weatherInsights.history.empty")}
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            {tab === "temp" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.textMuted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} dot={false} name="Max °C" />
                <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={2} dot={false} name="Min °C" />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.textMuted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} />
                <Tooltip
                  contentStyle={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="precip" fill="#3b82f6" radius={[2, 2, 0, 0]} name="mm" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default HistoryChart;
