import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { EudrCertificate, ComplianceStatus } from "../types/eudrFunnel";

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: "#22c55e",
  partial: "#eab308",
  non_compliant: "#ef4444",
  pending_verification: "#8b5cf6",
  expired: "#6b7280",
};

interface Props {
  certificate: EudrCertificate;
}

export default function EudrCertificateCard({ certificate }: Props) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[certificate.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-xl p-6 shadow-sm border border-emerald-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-900">
            {t("eudrFunnel.certificate.title")}
          </h3>
          <p className="text-xs text-emerald-600">{t("eudrFunnel.certificate.subtitle")}</p>
        </div>
        <span
          className="inline-block w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: statusColor }}
        >
          {certificate.score}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: t("eudrFunnel.certificate.producer"), value: certificate.producerName },
          { label: t("eudrFunnel.certificate.cooperative"), value: certificate.cooperative },
          { label: t("eudrFunnel.certificate.crop"), value: certificate.crop },
          { label: t("eudrFunnel.certificate.region"), value: certificate.region },
        ].map((item) => (
          <div key={item.label} className="bg-white/70 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{item.label}</p>
            <p className="text-sm font-medium text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>{t("eudrFunnel.certificate.issued")}: {new Date(certificate.issuedAt).toLocaleDateString()}</span>
        <span>{t("eudrFunnel.certificate.expires")}: {new Date(certificate.validUntil).toLocaleDateString()}</span>
      </div>

      {certificate.id && (
        <div className="p-2.5 bg-white rounded-lg border border-gray-200">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            {t("eudrFunnel.certificate.id")}
          </p>
          <p className="text-sm font-mono font-medium text-gray-700 truncate">{certificate.id}</p>
        </div>
      )}

      {certificate.qrData && (
        <motion.button
          onClick={() => window.open(certificate.qrData, "_blank")}
          className="mt-3 w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {t("eudrFunnel.certificate.verify")}
        </motion.button>
      )}
    </motion.div>
  );
}
