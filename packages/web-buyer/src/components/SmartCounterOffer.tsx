import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CurrencyCircleDollar, TrendUp, TrendDown, SealCheck } from "@phosphor-icons/react";
import PriceSparkChart from "./PriceSparkChart";
import type { SmartSuggestion } from "../types/negotiation";

interface Props {
  suggestion: SmartSuggestion;
  currentPrice: number;
  onApply: (price: number) => void;
  loading?: boolean;
}

export default function SmartCounterOffer({ suggestion, currentPrice, onApply, loading }: Props) {
  const { t } = useTranslation();

  const trendIcon = suggestion.marketTrend === "up" ? TrendUp : suggestion.marketTrend === "down" ? TrendDown : null;
  const trendColor = suggestion.marketTrend === "up" ? "#22c55e" : suggestion.marketTrend === "down" ? "#ef4444" : "#6b7280";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-50 to-white rounded-xl p-4 border border-violet-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <SealCheck size={16} className="text-violet-600" weight="fill" />
        <span className="text-sm font-semibold text-violet-900">
          {t("negotiation.smart.title")}
        </span>
        <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
          suggestion.confidence >= 80 ? "bg-green-100 text-green-700" :
          suggestion.confidence >= 60 ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {suggestion.confidence}% {t("negotiation.smart.confidence")}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <CurrencyCircleDollar size={14} className="text-emerald-600" />
          <span className="text-xs text-gray-500">{t("negotiation.smart.marketPrice")}</span>
          <span className="text-sm font-bold text-emerald-700">
            {suggestion.marketPrice.toLocaleString("fr-FR")}
          </span>
        </div>
        {trendIcon && (
          <div className="flex items-center gap-0.5" style={{ color: trendColor }}>
            {trendIcon === TrendUp ? (
              <TrendUp size={14} weight="bold" />
            ) : (
              <TrendDown size={14} weight="bold" />
            )}
            <span className="text-xs font-medium">
              {t(`negotiation.smart.trend.${suggestion.marketTrend}`)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-3">
        <PriceSparkChart
          offerPrice={currentPrice}
          marketPrice={suggestion.marketPrice}
          suggestedPrice={suggestion.suggestedPrice}
        />
      </div>

      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{suggestion.reasoning}</p>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 p-2 bg-white rounded-lg border border-violet-200 text-center">
          <p className="text-[9px] text-gray-400 uppercase">{t("negotiation.smart.min")}</p>
          <p className="text-sm font-bold text-violet-700">{suggestion.minRecommendation.toLocaleString("fr-FR")}</p>
        </div>
        <div className="flex-1 p-2 bg-violet-100 rounded-lg border border-violet-300 text-center">
          <p className="text-[9px] text-gray-500 uppercase">{t("negotiation.smart.suggested")}</p>
          <p className="text-sm font-bold text-violet-900">{suggestion.suggestedPrice.toLocaleString("fr-FR")}</p>
        </div>
        <div className="flex-1 p-2 bg-white rounded-lg border border-violet-200 text-center">
          <p className="text-[9px] text-gray-400 uppercase">{t("negotiation.smart.max")}</p>
          <p className="text-sm font-bold text-violet-700">{suggestion.maxRecommendation.toLocaleString("fr-FR")}</p>
        </div>
      </div>

      <motion.button
        onClick={() => onApply(suggestion.suggestedPrice)}
        disabled={loading}
        className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {loading ? "..." : t("negotiation.smart.apply")}
      </motion.button>
    </motion.div>
  );
}
