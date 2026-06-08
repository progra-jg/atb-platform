import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { QASample } from "../types/qualityAssurance";

interface Props {
  sample: QASample;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  collected: "bg-blue-100 text-blue-700",
  in_analysis: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default function QASampleCard({ sample, onClick }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-violet-200 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate">{sample.crop}</span>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[sample.status] ?? ""}`}>
            {t(`qa.status.${sample.status}`)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">{sample.producerName} · {sample.region}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
          <span>{sample.volumeKg.toLocaleString("fr-FR")} kg</span>
          <span>{t("qa.sample.sampleSize")} {sample.sampleSizeKg} kg</span>
          <span>{new Date(sample.requestedAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      <motion.div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0" whileHover={{ x: 3 }}>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M1 1L6 6L1 11" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
