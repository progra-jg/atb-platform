import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNegotiationSummaries } from "../services/negotiation";
import type { NegotiationSummary } from "../types/negotiation";
import { useAuth } from "../context/AuthContext";
import { CurrencyCircleDollar, ArrowsLeftRight, CheckCircle } from "@phosphor-icons/react";

export default function NegotiationWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<NegotiationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const s = await getNegotiationSummaries(user.id);
        if (mounted) setSummaries(s);
      } catch {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const active = summaries.filter((s) => s.status === "active");
  const accepted = summaries.filter((s) => s.status === "accepted");

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
      onClick={() => navigate("/negotiations")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{t("negotiation.widget.title")}</h3>
        <ArrowsLeftRight size={16} className="text-emerald-500" />
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{active.length}</p>
          <p className="text-[10px] text-gray-500">{t("negotiation.widget.active")}</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-600">{accepted.length}</p>
          <p className="text-[10px] text-gray-500">{t("negotiation.widget.accepted")}</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-amber-600">{summaries.length}</p>
          <p className="text-[10px] text-gray-500">{t("negotiation.widget.total")}</p>
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {active.slice(0, 3).map((s) => (
            <span key={s.id} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-full truncate max-w-[120px]">
              {s.crop}
            </span>
          ))}
          {active.length > 3 && (
            <span className="text-[10px] text-gray-400">+{active.length - 3}</span>
          )}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">{t("negotiation.widget.click")}</p>
    </motion.div>
  );
}
