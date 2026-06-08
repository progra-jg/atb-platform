import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLogisticsSummary } from "../services/logistics";
import type { LogisticsSummary } from "../types/logistics";
import { Truck, Package, MapPin, CheckCircle } from "@phosphor-icons/react";

export default function LogisticsWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<LogisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getLogisticsSummary();
        if (mounted) setSummary(s);
      } catch {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-28 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-36" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/logistics")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{t("logistics.widget.title")}</h3>
        <Truck size={16} className="text-emerald-500" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <p className="text-lg font-bold text-emerald-700">{summary?.activeShipments ?? 0}</p>
          <p className="text-[9px] text-gray-500">{t("logistics.widget.active")}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{summary?.inTransit ?? 0}</p>
          <p className="text-[9px] text-gray-500">{t("logistics.widget.inTransit")}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{summary?.deliveredToday ?? 0}</p>
          <p className="text-[9px] text-gray-500">{t("logistics.widget.today")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-0.5">
          <CheckCircle size={10} className="text-emerald-500" />
          {t("logistics.widget.avgDays")}: {summary?.avgDeliveryDays ?? "—"}
        </span>
        <span className="font-medium text-gray-600">
          {(summary?.totalCostMonth ?? 0).toLocaleString("fr-FR")} FCFA
        </span>
      </div>
    </motion.div>
  );
}
