import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getEudrStats } from "../services/eudrFunnel";
import type { EudrStats } from "../types/eudrFunnel";

const STATUS_CONFIG = {
  compliant:    { color: "#22c55e", bg: "bg-green-50" },
  partial:      { color: "#eab308", bg: "bg-yellow-50" },
  non_compliant: { color: "#ef4444", bg: "bg-red-50" },
} as const;

export default function EudrFunnelWidget() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<EudrStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getEudrStats();
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

  if (!stats || stats.totalAssessments === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("eudrFunnel.widget.title")}</h3>
        <p className="text-xs text-gray-400 text-center py-4">{t("eudrFunnel.noAssessment")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("eudrFunnel.widget.title")}</h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["compliant", "partial", "non_compliant"] as const).map((key) => (
          <div key={key} className={`rounded-lg p-2.5 text-center ${STATUS_CONFIG[key].bg}`}>
            <p className="text-lg font-bold" style={{ color: STATUS_CONFIG[key].color }}>
              {key === "compliant" ? stats.compliantCount : key === "partial" ? stats.partialCount : stats.nonCompliantCount}
            </p>
            <p className="text-[10px] text-gray-500">{t(`eudrFunnel.status.${key}`)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{t("eudrFunnel.widget.avgScore")}</span>
        <span className="font-semibold text-gray-800">{stats.avgScore}/100</span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #ef4444, #eab308, #22c55e)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${stats.avgScore}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{t("eudrFunnel.widget.topCrops")}</p>
        <div className="flex flex-wrap gap-1.5">
          {stats.topCrops.slice(0, 3).map((c) => (
            <span key={c.crop} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-full">
              {c.crop} ({c.count})
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500">{t("eudrFunnel.widget.certificates")}</span>
        <span className="font-semibold text-emerald-700">{stats.certificatesIssued}</span>
      </div>
    </div>
  );
}
