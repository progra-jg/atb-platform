import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { QACertificate } from "../types/qualityAssurance";
import { FileText, Download, CheckCircle, XCircle } from "@phosphor-icons/react";

interface Props {
  certificate: QACertificate;
}

export default function QACertificateCard({ certificate }: Props) {
  const { t } = useTranslation();
  const passed = certificate.result === "pass";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-xl border border-amber-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 flex items-center gap-2">
        <FileText size={16} className="text-white" weight="fill" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{t("qa.certificate.title")}</span>
        {passed ? (
          <CheckCircle size={14} className="text-green-200 ml-auto" weight="fill" />
        ) : (
          <XCircle size={14} className="text-red-200 ml-auto" weight="fill" />
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: t("qa.certificate.producer"), value: certificate.producerName },
            { label: t("qa.certificate.crop"), value: certificate.crop },
            { label: t("qa.certificate.region"), value: certificate.region },
            { label: t("qa.certificate.grade"), value: certificate.grade },
          ].map((item) => (
            <div key={item.label} className="bg-white/70 rounded-lg p-2">
              <p className="text-[9px] text-gray-400 uppercase">{item.label}</p>
              <p className="text-xs font-semibold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100 mb-3">
          <p className="text-[9px] text-gray-400 uppercase mb-2">{t("qa.certificate.results")}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("qa.analysis.moisture"), value: `${certificate.moistureContent}%` },
              { label: t("qa.analysis.impurity"), value: `${certificate.impurityRate}%` },
              { label: t("qa.analysis.defect"), value: `${certificate.defectRate}%` },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xs font-bold text-gray-800">{item.value}</p>
                <p className="text-[8px] text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
          <span>{t("qa.certificate.issued")}: {new Date(certificate.issueDate).toLocaleDateString("fr-FR")}</span>
          <span>{t("qa.certificate.expires")}: {new Date(certificate.validUntil).toLocaleDateString("fr-FR")}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-mono text-gray-400 truncate">{certificate.id}</span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-[11px] font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Download size={12} />
            {t("qa.certificate.download")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
