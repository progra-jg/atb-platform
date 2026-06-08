import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import EudrComplianceScore from "../components/EudrComplianceScore";
import EudrOnboardingForm from "../components/EudrOnboardingForm";
import EudrCertificateCard from "../components/EudrCertificateCard";
import EudrFunnelWidget from "../components/EudrFunnelWidget";
import { assessLotCompliance, getEudrStats } from "../services/eudrFunnel";
import type { EudrAssessment, EudrStats } from "../types/eudrFunnel";

const categories = [
  { key: "onboarding", labelKey: "eudrFunnel.tab.onboarding", icon: "📋" },
  { key: "results", labelKey: "eudrFunnel.tab.results", icon: "📊" },
  { key: "certificates", labelKey: "eudrFunnel.tab.certificates", icon: "📜" },
];

export default function EudrFunnelPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("onboarding");
  const [loading, setLoading] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<EudrAssessment | null>(null);
  const [stats, setStats] = useState<EudrStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleAssess = async (data: { lotId: string; crop: string; region: string }) => {
    setLoading(true);
    try {
      const result = await assessLotCompliance(
        data.lotId, data.crop, data.region, "current-user",
      );
      setLastAssessment(result);
      setActiveTab("results");
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      setStats(await getEudrStats());
    } catch {
      /* noop */
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-800">{t("eudrFunnel.pageTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("eudrFunnel.pageDesc")}</p>
      </motion.div>

      <div className="flex gap-2 mt-5 mb-6 border-b border-gray-100 pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveTab(cat.key);
              if (cat.key === "certificates") loadStats();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === cat.key
                ? "bg-emerald-100 text-emerald-800 font-medium"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>{cat.icon}</span>
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "onboarding" && (
        <EudrOnboardingForm onAssess={handleAssess} loading={loading} lastAssessment={lastAssessment} />
      )}

      {activeTab === "results" && lastAssessment && (
        <div className="space-y-4">
          <EudrComplianceScore assessment={lastAssessment} />
        </div>
      )}

      {activeTab === "results" && !lastAssessment && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">📋</p>
          <p className="text-sm">{t("eudrFunnel.noAssessment")}</p>
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-32 bg-gray-100 rounded-xl" />
              <div className="h-48 bg-gray-100 rounded-xl" />
            </div>
          ) : (
            <>
              {stats && <EudrFunnelWidget />}
              {lastAssessment?.certificateId && lastAssessment?.certificateUrl && (
                <EudrCertificateCard
                  certificate={{
                    id: lastAssessment.certificateId,
                    lotId: lastAssessment.lotId,
                    crop: lastAssessment.crop,
                    producerName: "Producteur Certifié",
                    cooperative: "Coopérative EUDR",
                    region: lastAssessment.region,
                    score: lastAssessment.score,
                    status: lastAssessment.status,
                    issuedAt: lastAssessment.assessedAt,
                    validUntil: lastAssessment.validUntil,
                    issuedById: lastAssessment.assessorId,
                    qrData: `${window.location.origin}/verify/${lastAssessment.certificateId}`,
                  }}
                />
              )}
              {(!stats || stats.certificatesIssued === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-1">📜</p>
                  <p className="text-sm">{t("eudrFunnel.noCertificates")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
