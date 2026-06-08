import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { estimateTransportCost } from "../services/logistics";
import type { TransportCostEstimate, TransportMode } from "../types/logistics";
import { TRANSPORT_MODES } from "../types/logistics";
import { CurrencyCircleDollar, Truck, Clock } from "@phosphor-icons/react";

interface Props {
  onEstimate: (estimate: TransportCostEstimate) => void;
}

export default function TransportCostCalculator({ onEstimate }: Props) {
  const { t } = useTranslation();
  const [distance, setDistance] = useState("200");
  const [volume, setVolume] = useState("1000");
  const [mode, setMode] = useState<TransportMode>("road");
  const [result, setResult] = useState<TransportCostEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    const d = Number(distance);
    const v = Number(volume);
    if (!d || !v) return;
    setLoading(true);
    try {
      const est = await estimateTransportCost(d, v, mode);
      setResult(est);
      onEstimate(est);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{t("logistics.calculator.title")}</h3>
      <p className="text-xs text-gray-500 mb-4">{t("logistics.calculator.desc")}</p>

      <div className="flex gap-2 mb-4">
        {TRANSPORT_MODES.map((m) => (
          <motion.button
            key={m.key}
            onClick={() => setMode(m.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 p-2.5 rounded-xl text-center border transition-colors ${
              mode === m.key
                ? "bg-emerald-50 border-emerald-300"
                : "bg-gray-50 border-gray-100 hover:bg-gray-100"
            }`}
          >
            <span className="text-lg">{m.icon}</span>
            <p className="text-[10px] font-medium text-gray-600 mt-0.5">{t(m.labelKey)}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 uppercase mb-1 block">{t("logistics.calculator.distance")}</label>
          <input
            value={distance}
            onChange={(e) => setDistance(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            type="text" inputMode="numeric"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 uppercase mb-1 block">{t("logistics.calculator.volume")}</label>
          <input
            value={volume}
            onChange={(e) => setVolume(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            type="text" inputMode="numeric"
          />
        </div>
      </div>

      <motion.button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <CurrencyCircleDollar size={14} />
        )}
        {t("logistics.calculator.calculate")}
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800">{t("logistics.calculator.breakdown")}</span>
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Clock size={12} />≈ {result.estimatedDays} {t("logistics.calculator.days")}
            </span>
          </div>
          <div className="space-y-1.5 mb-2">
            {[
              { label: t("logistics.calculator.baseCost"), value: result.baseCost },
              { label: t("logistics.calculator.fuelSurcharge"), value: result.fuelSurcharge },
              { label: t("logistics.calculator.insurance"), value: result.insuranceCost },
              { label: t("logistics.calculator.handling"), value: result.handlingCost },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-[11px]">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-700 font-medium">{item.value.toLocaleString("fr-FR")} FCFA</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-900">{t("logistics.calculator.total")}</span>
            <span className="text-lg font-bold text-emerald-700">{result.totalCost.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
