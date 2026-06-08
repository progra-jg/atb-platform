import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { EUDR_REQUIREMENTS } from "../types/eudrFunnel";
import type { EudrAssessment } from "../types/eudrFunnel";

interface Props {
  onAssess: (data: {
    lotId: string;
    crop: string;
    region: string;
  }) => void;
  loading?: boolean;
  lastAssessment?: EudrAssessment | null;
}

export default function EudrOnboardingForm({ onAssess, loading, lastAssessment }: Props) {
  const { t } = useTranslation();
  const [lotId, setLotId] = useState("");
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotId || !crop || !region) return;
    onAssess({ lotId, crop, region });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{t("eudrFunnel.onboarding.title")}</h3>
      <p className="text-sm text-gray-500 mb-5">{t("eudrFunnel.onboarding.desc")}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={lotId}
          onChange={(e) => setLotId(e.target.value)}
          placeholder={t("eudrFunnel.onboarding.lotPlaceholder")}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <div className="flex gap-2">
          <input
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder={t("eudrFunnel.onboarding.cropPlaceholder")}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder={t("eudrFunnel.onboarding.regionPlaceholder")}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? "..." : t("eudrFunnel.onboarding.submit")}
        </motion.button>
      </form>

      <div className="mt-5">
        <p className="text-xs font-medium text-gray-500 mb-2">{t("eudrFunnel.onboarding.requirements")}</p>
        <div className="space-y-1.5">
          {EUDR_REQUIREMENTS.map((req) => (
            <motion.div
              key={req.id}
              className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                lastAssessment?.requirements.find((r) => r.requirementId === req.id)?.satisfied
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-100 text-gray-500"
              }`}
              whileHover={{ x: 4 }}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                lastAssessment?.requirements.find((r) => r.requirementId === req.id)?.satisfied
                  ? "bg-green-500" : "bg-gray-300"
              }`}>
                {lastAssessment?.requirements.find((r) => r.requirementId === req.id)?.satisfied ? "✓" : String(req.weight) + "%"}
              </span>
              <span className={lastAssessment?.requirements.find((r) => r.requirementId === req.id)?.satisfied ? "text-green-700" : ""}>
                {t(req.labelKey)}
              </span>
              <span className="ml-auto text-gray-400">{req.weight}%</span>
            </motion.div>
          ))}
        </div>
      </div>

      {lastAssessment?.certificateId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <p className="text-sm font-medium text-emerald-800">
            {t("eudrFunnel.onboarding.certificateIssued")}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-mono">{lastAssessment.certificateId}</p>
        </motion.div>
      )}
    </div>
  );
}
