import React, { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChartBar, CalendarBlank, TrendUp, TrendDown, CurrencyCircleDollar,
  Download, Bell, Lightbulb, ArrowsClockwise, FileText, User, Users,
  Info, ChartLine,
} from "@phosphor-icons/react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, ComposedChart, BarChart, Bar, Legend,
  ReferenceLine, ReferenceArea,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchPriceHistory } from "../services/prices";
import { fetchContracts } from "../services/contracts";
import { createAlert } from "../services/alertsV2";
import { tCrop } from "../utils/i18n";
import { fetchPredictions, getTrend } from "../services/prediction";
import type { PredictionPoint, PredictionSummary } from "../services/prediction";
import Card from "../components/ui/Card";
import { formatNumber } from "../utils/format";

const CROPS = ["Maïs", "Cacao", "Anacarde", "Riz", "Soja"];
const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau", "Donga", "Alibori", "Atacora", "Littoral"];
const PERIODS = [
  { labelKey: "priceHistory.periods.6", value: 6 },
  { labelKey: "priceHistory.periods.12", value: 12 },
  { labelKey: "priceHistory.periods.24", value: 24 },
];

function sma(data: { avg: number }[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v.avg, 0) / period;
  });
}

function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const sx = data.reduce((s, d) => s + d.x, 0);
  const sy = data.reduce((s, d) => s + d.y, 0);
  const sxy = data.reduce((s, d) => s + d.x * d.y, 0);
  const sx2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const sy2 = data.reduce((s, d) => s + d.y * d.y, 0);
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const ssr = data.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0);
  const sst = data.reduce((s, d) => s + (d.y - sy / n) ** 2, 0);
  return { slope, intercept, r2: sst ? Math.max(0, 1 - ssr / sst) : 0 };
}

function seasonalDecomposition(data: { date: string; avg: number }[]) {
  const byMonth: Record<string, number[]> = {};
  for (const d of data) {
    const m = d.date.split("-")[1];
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(d.avg);
  }
  return Object.entries(byMonth).map(([m, vals]) => ({
    month: m,
    avg: vals.reduce((s, v) => s + v, 0) / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
  })).sort((a, b) => parseInt(a.month) - parseInt(b.month));
}

function forecastNextMonths(data: { date: string; avg: number }[], months: number) {
  const points = data.map((d, i) => ({ x: i, y: d.avg }));
  const reg = linearRegression(points);
  const last = points.length - 1;
  const result: { label: string; value: number; lower: number; upper: number }[] = [];
  const lastDate = new Date(data[data.length - 1].date);
  const residuals = points.map((p) => Math.abs(p.y - (reg.slope * p.x + reg.intercept)));
  const stdErr = residuals.reduce((s, r) => s + r, 0) / Math.max(residuals.length, 1) * 1.5;
  for (let i = 1; i <= months; i++) {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + i);
    const x = last + i;
    const v = reg.slope * x + reg.intercept;
    result.push({
      label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: Math.round(v * 100) / 100,
      lower: Math.round((v - stdErr) * 100) / 100,
      upper: Math.round((v + stdErr) * 100) / 100,
    });
  }
  return { forecast: result, reg };
}

function downloadCSV(data: { date: string; avg: number; min: number; max: number }[], culture: string, t: (key: string) => string) {
  const header = `${t("common.date")},${t("priceHistory.chartLabels.avgPrice")},${t("common.min")} ${t("common.price")},${t("common.max")} ${t("common.price")}`;
  const rows = data.map((d) => `${d.date},${d.avg},${d.min ?? d.avg},${d.max ?? d.avg}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `prix_${culture}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const monthNames: Record<string, string> = {
  "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Jun",
  "07": "Jul", "08": "Aoû", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
};

export default function PriceHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [activeCrop, setActiveCrop] = useState("Maïs");
  const [compareCrop, setCompareCrop] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [showForecast, setShowForecast] = useState(true);
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictRegion, setPredictRegion] = useState("Zou");
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["price-history", months],
    queryFn: () => fetchPriceHistory(undefined, months),
    refetchInterval: 300000,
  });

  const cropData = data?.find((c) => c.culture === activeCrop);
  const compareData = compareCrop ? data?.find((c) => c.culture === compareCrop) : null;
  const allCrops = data ?? [];
  const chartData = cropData?.data ?? [];
  const compareChartData = compareData?.data ?? [];

  const latest = chartData[chartData.length - 1];
  const first = chartData[0];
  const trend = latest && first ? ((latest.avg - first.avg) / first.avg * 100) : 0;
  const maxPrice = chartData.length ? Math.max(...chartData.map((d) => d.max || d.avg)) : 0;
  const minPrice = chartData.length ? Math.min(...chartData.map((d) => d.min || d.avg)) : 0;

  const smaData = useMemo(() => sma(chartData, 3), [chartData]);
  const seasonal = useMemo(() => seasonalDecomposition(chartData), [chartData]);
  const { forecast, reg } = useMemo(
    () => chartData.length > 3 ? forecastNextMonths(chartData, 3) : { forecast: [], reg: { slope: 0, intercept: 0, r2: 0 } },
    [chartData]
  );

  const combinedChart = useMemo(() => {
    if (!chartData.length) return [];
    return chartData.map((d, i) => ({
      date: d.date,
      [activeCrop]: d.avg,
      min: d.min,
      max: d.max,
      [`${activeCrop}_sma`]: smaData[i],
      ...(compareCrop && compareChartData[i] ? { [compareCrop]: compareChartData[i].avg } : {}),
    }));
  }, [chartData, compareChartData, activeCrop, compareCrop, smaData]);

  const forecastChart = useMemo(() => {
    if (!showForecast || !forecast.length) return [];
    const lastDate = chartData[chartData.length - 1]?.date;
    const lastVal = chartData[chartData.length - 1]?.avg;
    return [
      { date: lastDate, actual: lastVal, forecast: null, lower: null, upper: null },
      ...forecast.map((f) => ({ date: f.label, actual: null, forecast: f.value, lower: f.lower, upper: f.upper })),
    ];
  }, [forecast, showForecast, chartData]);

  const { data: predictionData, isLoading: predictionLoading } = useQuery({
    queryKey: ["predictions", activeCrop, predictRegion, showPredictions],
    queryFn: () => fetchPredictions(activeCrop, predictRegion, 90),
    enabled: showPredictions,
    staleTime: 120000,
  });

  const predictionPoints = predictionData ?? [];

  const predictionChart = useMemo(() => {
    if (!showPredictions || !predictionPoints.length || !chartData.length) return { merged: [] as any[], nextWeek: null as any, nextMonth: null as any, nextQuarter: null as any };
    const lastHistorical = chartData[chartData.length - 1];
    const lastDate = lastHistorical.date;
    const lastVal = lastHistorical.avg;
    const merged: any[] = combinedChart.map((d: any) => ({ ...d, predicted: undefined, predictedLower: undefined, predictedUpper: undefined }));
    let nw: any = null, nm: any = null, nq: any = null;
    const today = new Date();
    for (let i = 0; i < predictionPoints.length; i++) {
      const p = predictionPoints[i];
      if (p.date > lastDate) {
        merged.push({
          date: p.date,
          [activeCrop]: undefined, min: undefined, max: undefined, [`${activeCrop}_sma`]: undefined,
          predicted: p.predicted, predictedLower: p.lower, predictedUpper: p.upper,
        } as any);
      }
      const pd = new Date(p.date);
      const diffDays = Math.round((pd.getTime() - today.getTime()) / 86400000);
      if (diffDays >= 6 && diffDays <= 8 && !nw) nw = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) };
      if (diffDays >= 29 && diffDays <= 31 && !nm) nm = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) };
      if (diffDays >= 89 && diffDays <= 91 && !nq) nq = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) };
    }
    if (!nw && predictionPoints.length >= 7) { const p = predictionPoints[6]; nw = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) }; }
    if (!nm && predictionPoints.length >= 30) { const p = predictionPoints[29]; nm = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) }; }
    if (!nq && predictionPoints.length >= 90) { const p = predictionPoints[89]; nq = { date: p.date, predicted: p.predicted, lower: p.lower, upper: p.upper, trend: getTrend(p.predicted, lastVal) }; }
    return { merged, nextWeek: nw, nextMonth: nm, nextQuarter: nq };
  }, [showPredictions, predictionPoints, chartData, combinedChart, activeCrop, compareCrop]);

  const displayChartData = predictionChart.merged.length > 0 ? predictionChart.merged : combinedChart;

  const trendDir = trend > 2 ? "up" : trend < -2 ? "down" : "stable";
  const trendLabel = t(`priceHistory.trendLabels.${trendDir}`);
  const trendColor = trendDir === "up" ? "#2e7d32" : trendDir === "down" ? "#c62828" : colors.textMuted;

  const handleCreateSmartAlert = useCallback(async () => {
    try {
      await createAlert({
        type: "price_alert", crop: activeCrop,
        direction: trendDir === "up" ? "below" : "above",
        targetPrice: latest ? Math.round(latest.avg * (trendDir === "up" ? 0.9 : 1.1)) : 0,
      });
      navigate("/alerts");
    } catch {}
  }, [activeCrop, trendDir, latest, navigate]);

  return (
    <FadeIn>
      <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <Breadcrumb crumbs={[{ label: t("nav.dashboard"), path: "/dashboard" }, { label: t("priceHistory.pageTitle") }]} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
          <PageTitle title={t("priceHistory.pageTitle")} subtitle={t("priceHistory.subtitle")} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setShowPredictions(!showPredictions)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
              borderColor: showPredictions ? "#f57c00" : colors.borderLight,
              background: showPredictions ? "rgba(245,124,0,.1)" : "transparent",
              color: showPredictions ? "#f57c00" : colors.textMuted,
              fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}><ChartLine size={13} /> {t("predictions.toggle")}</button>
            <button onClick={() => setShowForecast(!showForecast)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
              borderColor: showForecast ? colors.accent : colors.borderLight,
              background: showForecast ? colors.accentLight : "transparent",
              color: showForecast ? colors.accent : colors.textMuted,
              fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}><TrendUp size={13} /> {t("priceHistory.forecast")}</button>
            <button onClick={() => setShowSeasonal(!showSeasonal)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1.5px solid",
              borderColor: showSeasonal ? "#0891b2" : colors.borderLight,
              background: showSeasonal ? "rgba(8,145,178,.1)" : "transparent",
              color: showSeasonal ? "#0891b2" : colors.textMuted,
              fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}><CalendarBlank size={13} /> {t("priceHistory.seasonal")}</button>
            <button onClick={() => chartData.length && downloadCSV(chartData, activeCrop, t)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1.5px solid", borderColor: colors.borderLight,
              background: "transparent", color: colors.textMuted, fontSize: 11, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}><Download size={13} /> {t("priceHistory.csv")}</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {CROPS.map((crop, i) => (
            <button key={crop} onClick={() => setActiveCrop(crop)} style={{
              padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
              borderColor: activeCrop === crop ? colors.accent : colors.borderLight,
              background: activeCrop === crop ? colors.accentLight : colors.surface,
              color: activeCrop === crop ? colors.accent : colors.textSecondary,
              fontSize: 13, fontWeight: activeCrop === crop ? 700 : 500, cursor: "pointer",
              transition: "all 0.15s", animation: `fadeSlideUp 0.3s ease ${i * 0.04}s both`,
            }}>{tCrop(crop)}</button>
          ))}
          <div style={{ width: 1, height: 20, background: colors.borderLight, margin: "0 4px" }} />
          <select value={compareCrop || ""} onChange={(e) => setCompareCrop(e.target.value || null)} style={{
            padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${colors.borderLight}`,
            fontSize: 12, background: colors.surface, color: compareCrop ? colors.accent : colors.textMuted,
            cursor: "pointer",
          }}>
            <option value="">{t("priceHistory.compare")}</option>
            {CROPS.filter((c) => c !== activeCrop).map((c) => <option key={c} value={c}>{tCrop(c)}</option>)}
          </select>
          {showPredictions && (
            <select value={predictRegion} onChange={(e) => setPredictRegion(e.target.value)} style={{
              padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${colors.borderLight}`,
              fontSize: 12, background: colors.surface, color: colors.text, cursor: "pointer",
            }}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setMonths(p.value)} style={{
              padding: "5px 12px", borderRadius: 8, border: "1.5px solid",
              borderColor: months === p.value ? colors.accent : colors.borderLight,
              background: months === p.value ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : "transparent",
              color: months === p.value ? "#fff" : colors.textSecondary,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{t(p.labelKey)}</button>
          ))}
        </div>

        {latest && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
            <StatCard label={t("priceHistory.currentPrice")} value={formatNumber(latest.avg)} unit={`${t("common.currency")}/kg`} color={colors.text} />
            <StatCard label={t("priceHistory.high")} value={formatNumber(maxPrice)} unit={t("common.currency")} color="#e53935" />
            <StatCard label={t("priceHistory.low")} value={formatNumber(minPrice)} unit={t("common.currency")} color="#43a047" />
            <StatCard label={t("priceHistory.trend")} value={trendLabel} unit={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`} color={trendColor} icon={trendDir === "up" ? <TrendUp size={14} /> : trendDir === "down" ? <TrendDown size={14} /> : <ArrowsClockwise size={14} />} />
            <StatCard label={t("priceHistory.confidence")} value={`${(reg.r2 * 100).toFixed(0)}%`} unit="R²" color={reg.r2 > 0.7 ? "#2e7d32" : reg.r2 > 0.4 ? "#f57f17" : colors.textMuted} />
          </div>
        )}

        <div ref={chartRef} style={{ background: colors.surface, borderRadius: 14, padding: isMobile ? 12 : 20, border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowMd, marginBottom: 20 }}>
          {isLoading ? (
            <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 24, height: 24, border: "3px solid", borderColor: `${colors.borderLight} ${colors.borderLight} ${colors.borderLight} ${colors.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: colors.textMuted }}>{t("priceHistory.noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={displayChartData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predictionCIGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f57c00" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f57c00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.textMuted }} tickFormatter={(d: any) => { const p = String(d).split("-"); return `${monthNames[p[1]] || p[1]} ${p[0].slice(2)}`; }} />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} domain={["auto", "auto"]} width={40} />
                <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} labelFormatter={(d: any) => { const p = String(d).split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }} formatter={(value: any, name: any) => [`${formatNumber(Number(value))} ${t("common.currency")}`, name]} />
                <Legend formatter={(value: any) => <span style={{ color: colors.textSecondary, fontSize: 11 }}>{value}</span>} />
                <Area type="monotone" dataKey="min" fill="none" stroke="transparent" />
                <Area type="monotone" dataKey="max" fill="none" stroke="transparent" />
                <Area type="monotone" dataKey={activeCrop} fill="url(#areaGrad)" stroke="none" />
                <Line type="monotone" dataKey={activeCrop} stroke={colors.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: colors.accent }} name={activeCrop} />
                <Line type="monotone" dataKey={`${activeCrop}_sma`} stroke="#e65100" strokeWidth={1.5} strokeDasharray="5,3" dot={false} name={t("priceHistory.sma")} connectNulls />
                {compareCrop && (
                  <Line type="monotone" dataKey={compareCrop} stroke="#7c3aed" strokeWidth={2} strokeDasharray="4,2" dot={false} activeDot={{ r: 4, fill: "#7c3aed" }} name={compareCrop} />
                )}
                {showPredictions && predictionPoints.length > 0 && (
                  <>
                    <Area type="monotone" dataKey="predictedUpper" fill="url(#predictionCIGrad)" stroke="none" />
                    <Area type="monotone" dataKey="predictedLower" fill="url(#predictionCIGrad)" stroke="none" />
                    <Line type="monotone" dataKey="predicted" stroke="#f57c00" strokeWidth={2.5} strokeDasharray="6,3" dot={false} activeDot={{ r: 5, fill: "#f57c00" }} name={t("predictions.title")} connectNulls />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {showForecast && forecast.length > 0 && (
            <div style={{ background: colors.surface, borderRadius: 14, padding: 16, border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowMd }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendUp size={15} color={colors.accent} /> {t("priceHistory.forecastTitle")}
                </h3>
                <span style={{ fontSize: 10, color: colors.textMuted }}>R² = {(reg.r2 * 100).toFixed(0)}%</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {forecast.map((f, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 80, textAlign: "center", padding: "8px 4px", borderRadius: 8, background: colors.statBg }}>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{f.label.split("-").reverse().slice(0, 2).join("/")}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: reg.slope > 0 ? "#2e7d32" : "#c62828", marginTop: 2 }}>{formatNumber(Math.round(f.value))}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted }}>{formatNumber(Math.round((f.upper - f.lower) / 2))}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <ComposedChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="2 2" stroke={colors.borderLight} />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: colors.textMuted }} tickFormatter={(d) => { const p = d.split("-"); return `${monthNames[p[1]] || p[1]}`; }} />
                  <YAxis tick={{ fontSize: 8, fill: colors.textMuted }} width={30} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} formatter={(value: any) => [formatNumber(Number(value))]} />
                  <Area type="monotone" dataKey="upper" fill={colors.borderLight} stroke="none" />
                  <Area type="monotone" dataKey="lower" fill={colors.borderLight} stroke="none" />
                  <Line type="monotone" dataKey="actual" stroke={colors.accent} strokeWidth={2} dot={{ r: 3 }} name={t("priceHistory.actual")} />
                  <Line type="monotone" dataKey="forecast" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5,3" dot={{ r: 3 }} name={t("priceHistory.forecastLabel")} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                <Info size={10} /> {t("priceHistory.forecastNote")}
              </div>
            </div>
          )}

          {showSeasonal && seasonal.length > 0 && (
            <div style={{ background: colors.surface, borderRadius: 14, padding: 16, border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowMd }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
                  <CalendarBlank size={15} color="#0891b2" /> {t("priceHistory.seasonalTitle")}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={seasonal}>
                  <CartesianGrid strokeDasharray="2 2" stroke={colors.borderLight} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: colors.textMuted }} tickFormatter={(m) => monthNames[m] || m} />
                  <YAxis tick={{ fontSize: 8, fill: colors.textMuted }} width={30} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} formatter={(value: any) => [`${formatNumber(Number(value))} ${t("common.currency")}`]} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill={colors.accent} opacity={0.8} name={t("priceHistory.chartLabels.avgPrice")} />
                  <Line type="monotone" dataKey="avg" stroke="#e65100" strokeWidth={2} dot={false} name="" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {showPredictions && predictionChart.nextWeek && (
          <div style={{ background: colors.surface, borderRadius: 14, padding: 16, border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowMd, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
                <ChartLine size={15} color="#f57c00" /> {t("predictions.title")}
              </h3>
              {predictionLoading && <span style={{ fontSize: 10, color: colors.textMuted }}>{t("predictions.generating")}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {[
                { key: "nextWeek", label: t("predictions.nextWeek"), data: predictionChart.nextWeek },
                { key: "nextMonth", label: t("predictions.nextMonth"), data: predictionChart.nextMonth },
                { key: "nextQuarter", label: t("predictions.nextQuarter"), data: predictionChart.nextQuarter },
              ].filter((item) => item.data).map((item) => {
                const d = item.data;
                const trendDir = d.trend;
                const trendColor = trendDir === "up" ? "#2e7d32" : trendDir === "down" ? "#c62828" : colors.textMuted;
                return (
                  <div key={item.key} style={{ padding: "12px 14px", borderRadius: 10, background: colors.statBg, border: `1px solid ${colors.borderLight}` }}>
                    <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".3px", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{formatNumber(d.predicted)}</span>
                      <span style={{ fontSize: 10, color: colors.textMuted }}>{t("common.currency")}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: trendColor, display: "flex", alignItems: "center", gap: 2 }}>
                        {trendDir === "up" ? <TrendUp size={12} weight="bold" /> : trendDir === "down" ? <TrendDown size={12} weight="bold" /> : <ArrowsClockwise size={12} />}
                        {t(`predictions.trend.${trendDir}`)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                      {t("predictions.confidence")}: {formatNumber(d.lower)} – {formatNumber(d.upper)} {t("common.currency")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {latest && (
          <div style={{
            marginBottom: 20, padding: "14px 18px", borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.accentLight}, rgba(8,145,178,0.06))`,
            border: "1.5px solid", borderColor: colors.borderLight,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${colors.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lightbulb size={16} color={colors.accent} weight="fill" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
                  {trendDir === "up"
                    ? t("priceHistory.smartAlert.up", { crop: tCrop(activeCrop), trend: trend.toFixed(1) })
                    : trendDir === "down"
                    ? t("priceHistory.smartAlert.down", { crop: tCrop(activeCrop), trend: Math.abs(trend).toFixed(1) })
                    : t("priceHistory.smartAlert.stable", { crop: tCrop(activeCrop) })}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                  {trendDir === "up"
                    ? t("priceHistory.smartAlert.upAction", { price: formatNumber(Math.round(latest.avg * 0.9)) })
                    : trendDir === "down"
                    ? t("priceHistory.smartAlert.downAction", { price: formatNumber(Math.round(latest.avg * 1.1)) })
                    : t("priceHistory.smartAlert.stableAction")}
                </div>
              </div>
            </div>
            <button onClick={handleCreateSmartAlert} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              color: "#fff", fontSize: 11, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              whiteSpace: "nowrap",
            }}><Bell size={13} weight="fill" /> {t("priceHistory.createAlert")}</button>
          </div>
        )}

        {latest && <PortfolioImpactPanel crop={activeCrop} currentPrice={latest.avg} />}

        {allCrops.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px", color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
              <CurrencyCircleDollar size={16} /> {t("priceHistory.summary")}
            </h3>
            <div style={{ display: "grid", gap: 6 }}>
              {allCrops.map((crop, i) => {
                const d = crop.data;
                const last = d[d.length - 1];
                const firstVal = d[0];
                const change = firstVal && last ? ((last.avg - firstVal.avg) / firstVal.avg * 100) : 0;
                const pts = d.map((p, i) => ({ x: i, y: p.avg }));
                const reg2 = linearRegression(pts);
                return (
                  <div key={crop.culture} onClick={() => { setActiveCrop(crop.culture); setCompareCrop(null); }} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: colors.surface, borderRadius: 10,
                    border: `1.5px solid ${colors.borderLight}`, cursor: "pointer",
                    transition: "all 0.15s", animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.boxShadow = colors.shadowSm; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 24, borderRadius: 2, background: change >= 0 ? "#2e7d32" : "#c62828" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{tCrop(crop.culture)}</div>
                        <div style={{ fontSize: 10, color: colors.textMuted }}>{d.length} {t("priceHistory.months")} · R² {(reg2.r2 * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{formatNumber(last?.avg)} <span style={{ fontSize: 10, fontWeight: 400, color: colors.textMuted }}>{t("common.currency")}</span></div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: change >= 0 ? "#2e7d32" : "#c62828", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        {change >= 0 ? <TrendUp size={11} /> : <TrendDown size={11} />}
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

function PortfolioImpactPanel({ crop, currentPrice }: { crop: string; currentPrice: number }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const lang = i18n.language;

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: fetchContracts,
    enabled: !!user,
    staleTime: 60000,
  });

  const active = contracts?.filter(
    (c) => c.culture === crop && (c.statut === "actif" || c.statut === "signe")
  ) ?? [];

  if (!user || active.length === 0 || !currentPrice) return null;

  const totalVolume = active.reduce((s, c) => s + (c.volumeKg || 0), 0);
  const totalWeighted = active.reduce((s, c) => s + (c.prixKg || 0) * (c.volumeKg || 0), 0);
  const avgPrice = totalWeighted / totalVolume;
  const diff = currentPrice - avgPrice;
  const diffPercent = (diff / avgPrice) * 100;
  const unrealizedPnl = diff * totalVolume;
  const isPositive = diff >= 0;

  const fmt = (n: number) => formatNumber(Math.round(n));

  return (
    <div style={{
      background: `linear-gradient(135deg, ${isPositive ? "#2e7d32" : "#c62828"}06, ${colors.surface})`,
      borderRadius: 14, padding: 16,
      border: `1.5px solid ${isPositive ? "#2e7d32" : "#c62828"}20`,
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <FileText size={14} color={colors.accent} />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {lang === "en" ? "Your portfolio impact" : "Impact sur votre portefeuille"}
        </span>
        {isLoading && (
          <div style={{ width: 12, height: 12, border: "2px solid", borderColor: `${colors.borderLight} ${colors.borderLight} ${colors.borderLight} ${colors.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginLeft: 4 }} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: colors.surface, border: `1px solid ${colors.borderLight}` }}>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".3px" }}>
            {lang === "en" ? "Active contracts" : "Contrats actifs"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 2 }}>{active.length}</div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: colors.surface, border: `1px solid ${colors.borderLight}` }}>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".3px" }}>
            {lang === "en" ? "Total volume" : "Volume total"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 2 }}>{fmt(totalVolume)} kg</div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: colors.surface, border: `1px solid ${colors.borderLight}` }}>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".3px" }}>
            {lang === "en" ? "Avg price" : "Prix moyen"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 2 }}>{fmt(avgPrice)} <span style={{ fontSize: 10, color: colors.textMuted }}>FCFA</span></div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: colors.surface, border: `1px solid ${colors.borderLight}` }}>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".3px" }}>
            {lang === "en" ? "P&L" : "Gain/Perte"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: isPositive ? "#2e7d32" : "#c62828", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {isPositive ? <TrendUp size={14} /> : <TrendDown size={14} />}
            {fmt(unrealizedPnl)} <span style={{ fontSize: 10, color: colors.textMuted }}>FCFA</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>
        {lang === "en" ? (
          <>Market price is <strong style={{ color: isPositive ? "#2e7d32" : "#c62828" }}>{isPositive ? "+" : ""}{diffPercent.toFixed(1)}%</strong> vs your average contract price.</>
        ) : (
          <>Le prix marché est <strong style={{ color: isPositive ? "#2e7d32" : "#c62828" }}>{isPositive ? "+" : ""}{diffPercent.toFixed(1)}%</strong> par rapport à votre prix contractuel moyen.</>
        )}
      </div>
      <button onClick={() => navigate(`/contracts?crop=${crop}`)} style={{
        marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "none",
        background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
        color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "inherit",
      }}>
        <FileText size={12} />
        {lang === "en" ? "View my contracts" : "Voir mes contrats"}
      </button>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div style={{ background: colors.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${colors.border}`, boxShadow: colors.shadowSm }}>
      <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".3px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
        <span style={{ fontSize: 9, color: colors.textMuted }}>{unit}</span>
      </div>
    </div>
  );
}
