import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getDemandStats } from "../services/demand";
import type { DemandStats } from "../types/demand";
import { useNavigate } from "react-router-dom";

export default function DemandDashboardWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DemandStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getDemandStats();
        if (mounted) setStats(s);
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
        <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-32" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/demand")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{t("demand.widget.title")}</h3>
        <motion.span
          className="text-lg"
          whileHover={{ scale: 1.2 }}
        >
          📢
        </motion.span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeSignals ?? 0}</p>
          <p className="text-[10px] text-gray-500">{t("demand.widget.active")}</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-600">{stats?.totalMatches ?? 0}</p>
          <p className="text-[10px] text-gray-500">{t("demand.widget.matches")}</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-amber-600">{stats?.pendingResponses ?? 0}</p>
          <p className="text-[10px] text-gray-500">{t("demand.widget.pending")}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{t("demand.widget.click")}</p>
    </motion.div>
  );
}
