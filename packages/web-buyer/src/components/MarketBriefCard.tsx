import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBar, TrendUp, TrendDown, CaretUp, CaretDown,
  Lightning, ArrowRight, SealCheck, WarningCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import Card, { CardHeader, CardDivider } from "./ui/Card";
import Button from "./ui/Button";
import Skeleton from "./Skeleton";
import WhatsAppShareButton from "./WhatsAppShareButton";
import { generateMarketBrief, getBuySignals, getForecast } from "../services/marketIntel";
import type { MarketBrief, BuySignal, PriceAnalysis } from "../types/marketIntel";

const TREND_COLORS: Record<string, string> = {
  strong_up: "#2e9b4e", up: "#4caf50", stable: "#ffc107",
  down: "#ff9800", strong_down: "#f44336",
};

const SIGNAL_LABELS: Record<string, string> = {
  buy: "marketIntel.signal.buy",
  watch: "marketIntel.signal.watch",
  wait: "marketIntel.signal.wait",
};

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 60;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalysisRow({ analysis, index }: { analysis: PriceAnalysis; index: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const color = TREND_COLORS[analysis.trend] ?? colors.textSecondary;
  const TrendIcon = analysis.trend === "up" || analysis.trend === "strong_up" ? CaretUp : analysis.trend === "down" || analysis.trend === "strong_down" ? CaretDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 0", borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{analysis.crop}</span>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
            background: analysis.signal === "buy" ? "#2e9b4e18" : analysis.signal === "watch" ? "#ffc10718" : "#f4433618",
            color: analysis.signal === "buy" ? "#2e9b4e" : analysis.signal === "watch" ? "#ff9800" : "#f44336",
          }}>
            {t(SIGNAL_LABELS[analysis.signal])}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
            {analysis.currentPrice.toLocaleString()}
          </span>
          <span style={{ fontSize: 9, color: colors.textMuted }}>FCFA/kg</span>
          {TrendIcon && <TrendIcon size={10} color={color} weight="fill" />}
          <span style={{ fontSize: 9, color, fontWeight: 600 }}>
            {analysis.change > 0 ? "+" : ""}{analysis.change}%
          </span>
        </div>
      </div>
      <WhatsAppShareButton crop={analysis.crop} price={analysis.currentPrice} change={analysis.change} size={14} />
      <MiniSparkline values={analysis.history ?? []} color={color} />
    </motion.div>
  );
}

function ForecastChip({ analysis }: { analysis: PriceAnalysis }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const f = getForecast(analysis);
  const direction = f.predictedNext > f.currentPrice ? "up" : f.predictedNext < f.currentPrice ? "down" : "flat";
  const color = direction === "up" ? colors.success : direction === "down" ? colors.error : colors.textSecondary;
  const pct = f.currentPrice > 0 ? Math.round(((f.predictedNext - f.currentPrice) / f.currentPrice) * 100) : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 8px", borderRadius: 6, fontSize: 10,
      background: colors.surfaceHover,
    }}>
      {direction === "up" ? <CaretUp size={10} color={color} weight="fill" /> : direction === "down" ? <CaretDown size={10} color={color} weight="fill" /> : null}
      <span style={{ color: colors.text, fontWeight: 600 }}>
        {f.predictedNext.toLocaleString()} FCFA
      </span>
      <span style={{ color, fontWeight: 600 }}>
        ({pct > 0 ? "+" : ""}{pct}%)
      </span>
      <span style={{ color: colors.textMuted }}>
        · {f.daysAhead}d
      </span>
    </div>
  );
}

export default function MarketBriefCard({ onViewAll }: { onViewAll?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const profile = useUserProfile();
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [buySignals, setBuySignals] = useState<BuySignal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const b = await generateMarketBrief(profile.onboarding.productsOfInterest);
      setBrief(b);
      setBuySignals(getBuySignals(b.analyses));
    } finally {
      setLoading(false);
    }
  }, [profile.onboarding.productsOfInterest]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Card variant="premium">
        <CardHeader icon={<ChartBar size={18} />} title={t("marketIntel.title")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0" }}>
              <div style={{ flex: 1 }}>
                <Skeleton width="50%" height={12} mb={4} />
                <Skeleton width="40%" height={14} />
              </div>
              <Skeleton width={60} height={24} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!brief || brief.analyses.length === 0) {
    return (
      <Card variant="premium">
        <CardHeader icon={<ChartBar size={18} />} title={t("marketIntel.title")} />
        <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: colors.textMuted }}>
          {t("marketIntel.empty")}
        </div>
      </Card>
    );
  }

  const sentimentColor = brief.marketSentiment === "bullish" ? colors.success : brief.marketSentiment === "bearish" ? colors.error : colors.warning;
  const SentimentIcon = brief.marketSentiment === "bullish" ? TrendUp : brief.marketSentiment === "bearish" ? TrendDown : WarningCircle;

  return (
    <Card variant="premium">
      <CardHeader
        icon={<ChartBar size={18} />}
        title={t("marketIntel.title")}
        subtitle={t("marketIntel.tracking", { count: brief.totalCropsTracked })}
        action={onViewAll && <Button variant="ghost" size="sm" onClick={onViewAll}>{t("common.viewAll")} →</Button>}
      />

      {/* Market Sentiment */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
        padding: "8px 12px", borderRadius: 8,
        background: `${sentimentColor}0c`,
      }}>
        <SentimentIcon size={16} color={sentimentColor} />
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>
          {t("marketIntel.sentimentLabel")} : <span style={{ color: sentimentColor }}>{t(`marketIntel.sentiment.${brief.marketSentiment}`)}</span>
        </span>
        {brief.analyses.length > 0 && (
          <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: "auto" }}>
            Ø {brief.analyses.reduce((a, b) => a + b.currentPrice, 0) / brief.analyses.length} FCFA
          </span>
        )}
      </div>

      {/* Buy Signals */}
      {buySignals.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>
            <Lightning size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {t("marketIntel.signals")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {buySignals.slice(0, 2).map((s, i) => (
              <div key={s.crop + i} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 6,
                background: s.confidence >= 60 ? "#2e9b4e0c" : "#ffc1070c",
              }}>
                <SealCheck size={12} color={s.confidence >= 60 ? "#2e9b4e" : "#ffc107"} weight="fill" />
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, flex: 1 }}>
                  {s.crop} — {t(s.reasonKey)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: colors.text }}>
                  {s.currentPrice.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CardDivider />

      {/* Crop Analyses */}
      <div>
        {brief.analyses.slice(0, 5).map((a, i) => (
          <AnalysisRow key={a.crop + i} analysis={a} index={i} />
        ))}
      </div>

      {/* Forecast */}
      {brief.topBuySignal && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.textSecondary, marginBottom: 4 }}>
            {t("marketIntel.forecastFor", { crop: brief.topBuySignal.crop })}
          </div>
          <ForecastChip analysis={brief.topBuySignal} />
        </div>
      )}
    </Card>
  );
}
