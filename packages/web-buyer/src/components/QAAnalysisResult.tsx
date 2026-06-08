import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { QAAnalysis } from "../types/qualityAssurance";
import { SealCheck, WarningCircle } from "@phosphor-icons/react";

interface Props {
  analysis: QAAnalysis;
}

export default function QAAnalysisResult({ analysis }: Props) {
  const { t } = useTranslation();
  const passed = analysis.result === "pass";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          passed ? "bg-emerald-100" : "bg-red-100"
        }`}>
          {passed ? (
            <SealCheck size={18} className="text-emerald-600" weight="fill" />
          ) : (
            <WarningCircle size={18} className="text-red-500" weight="fill" />
          )}
        </div>
        <div>
          <p className={`text-sm font-semibold ${passed ? "text-emerald-800" : "text-red-800"}`}>
            {t(`qa.analysis.result.${analysis.result}`)}
          </p>
          <p className="text-[10px] text-gray-500">{analysis.analyst} · {new Date(analysis.analysisDate).toLocaleDateString("fr-FR")}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: t("qa.analysis.moisture"), value: analysis.moistureContent != null ? `${analysis.moistureContent}%` : "—" },
          { label: t("qa.analysis.impurity"), value: analysis.impurityRate != null ? `${analysis.impurityRate}%` : "—" },
          { label: t("qa.analysis.defect"), value: analysis.defectRate != null ? `${analysis.defectRate}%` : "—" },
        ].map((item) => (
          <div key={item.label} className="p-2 bg-white rounded-lg border border-gray-100 text-center">
            <p className="text-[9px] text-gray-400 uppercase">{item.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${passed ? "text-emerald-700" : "text-red-600"}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {analysis.grade && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{t("qa.analysis.grade")}</span>
          <span className="font-bold text-gray-800">{analysis.grade}</span>
        </div>
      )}

      {analysis.notes && (
        <p className="text-[11px] text-gray-600 mt-2 italic">"{analysis.notes}"</p>
      )}
    </motion.div>
  );
}
