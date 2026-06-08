import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQASummary } from "../services/qualityAssurance";
import type { QASummary } from "../types/qualityAssurance";
import { SealCheck } from "@phosphor-icons/react";

export default function QAWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<QASummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getQASummary();
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
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/quality")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{t("qa.widget.title")}</h3>
        <SealCheck size={16} className="text-violet-500" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-700">{summary?.pendingSamples ?? 0}</p>
          <p className="text-[9px] text-gray-500">{t("qa.widget.pending")}</p>
        </div>
        <div className="text-center p-2 bg-indigo-50 rounded-lg">
          <p className="text-lg font-bold text-indigo-700">{summary?.inAnalysis ?? 0}</p>
          <p className="text-[9px] text-gray-500">{t("qa.widget.inAnalysis")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{t("qa.widget.passRate")}: <span className="font-bold text-emerald-600">{summary?.passRate ?? 0}%</span></span>
        <span>{summary?.recentCertificates ?? 0} {t("qa.widget.certificates")}</span>
      </div>
    </motion.div>
  );
}
