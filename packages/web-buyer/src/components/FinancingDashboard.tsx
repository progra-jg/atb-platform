import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Coins, ArrowRight, ArrowCounterClockwise,
  Plant, Flask, Tractor, Truck, Warehouse, Drop, Certificate as CertIcon, Users,
  CaretRight, Spinner,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useTrustScore } from "../hooks/useTrustScore";
import { checkEligibility, applyForFinancing, getActiveContracts, repayContract } from "../services/financing";
import type { FinancingEligibility, FinancingOffer, FinancingContract } from "../types/financing";

const OFFER_ICONS: Record<string, React.ElementType> = {
  seeds_maize: Plant, seeds_rice: Plant, fertilizer: Flask, pesticide: Flask,
  equipment: Tractor, transport: Truck, storage: Warehouse, irrigation: Drop,
  certification: CertIcon, labor: Users,
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  repaid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  defaulted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const REPAY_STATUS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  defaulted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function FinancingDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<FinancingEligibility | null>(null);
  const [contracts, setContracts] = useState<FinancingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<FinancingOffer | null>(null);
  const [amount, setAmount] = useState("");
  const [collateralRef, setCollateralRef] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const producteurId = user?.id || "prod_1";
  const { data: trustScoreData } = useTrustScore(producteurId);
  const trustScore = trustScoreData ? trustScoreData.overall * 10 : 650;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [elig, ctr] = await Promise.all([
        checkEligibility(producteurId, trustScore),
        getActiveContracts(producteurId),
      ]);
      setEligibility(elig);
      setContracts(ctr);
    } catch {
      setError(t("common.error"));
    }
    setLoading(false);
  }, [producteurId, trustScore, t]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (!selectedOffer || !amount) return;
    setApplying(true);
    setError("");
    setSuccess("");
    try {
      await applyForFinancing(producteurId, trustScore, selectedOffer.id, Number(amount), "harvest", collateralRef || undefined);
      setSuccess(t("financing.applySuccess"));
      setSelectedOffer(null);
      setAmount("");
      setCollateralRef("");
      load();
    } catch {
      setError(t("common.error"));
    }
    setApplying(false);
  };

  const handleRepay = async (contractId: string) => {
    try {
      await repayContract(contractId, 0, `repay_${Date.now()}`);
      load();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{error}</div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm border border-green-200 dark:border-green-800">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t("financing.eligibility"), value: eligibility?.eligible ? t("common.yes") : t("common.no"), icon: eligibility?.eligible ? CheckCircle : XCircle, color: eligibility?.eligible ? "text-green-600" : "text-red-500" },
          { label: t("financing.maxAmount"), value: `${(eligibility?.maxAmount || 0).toLocaleString()} XOF`, icon: Coins, color: "text-blue-600" },
          { label: t("financing.activeContracts"), value: eligibility?.activeContracts || 0, icon: Clock, color: "text-amber-600" },
          { label: t("financing.repaymentRate"), value: `${eligibility?.repaymentRate || 0}%`, icon: ArrowCounterClockwise, color: "text-green-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={22} className={stat.color} weight="fill" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {!eligibility?.eligible && eligibility?.reason && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm border border-amber-200 dark:border-amber-800">
          {eligibility.reason}
        </div>
      )}

      {eligibility?.eligible && (
        <>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("financing.availableOffers")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibility.availableOffers.map((offer, i) => {
                const Icon = OFFER_ICONS[offer.inputType] || Plant;
                const isSelected = selectedOffer?.id === offer.id;
                return (
                  <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedOffer(isSelected ? null : offer)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                        <Icon size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{offer.label}</div>
                        <div className="text-xs text-gray-500">{offer.durationDays}j - {offer.interestRate}%</div>
                      </div>
                      <CaretRight size={16} className={`text-gray-400 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{offer.maxAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">XOF</span></span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t("financing.scoreMin")} {offer.minTrustScore}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {selectedOffer && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t("financing.applyTitle")} — {selectedOffer.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("financing.amount")}</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Max: ${selectedOffer.maxAmount.toLocaleString()} XOF`}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("financing.collateralRef")}</label>
                    <input type="text" value={collateralRef} onChange={(e) => setCollateralRef(e.target.value)}
                      placeholder={t("financing.collateralPlaceholder")}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleApply} disabled={applying || !amount}
                    className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    {applying ? <Spinner size={16} className="animate-spin" /> : <ArrowRight size={16} weight="bold" />}
                    {applying ? t("common.sending") : t("financing.apply")}
                  </button>
                  <button onClick={() => setSelectedOffer(null)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {contracts.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("financing.activeContractsTitle")}</h2>
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Coins size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{c.amount.toLocaleString()} XOF</div>
                      <div className="text-xs text-gray-500">{t("financing.repayable")}: {c.totalRepayable.toLocaleString()} XOF</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[c.status] || ""}`}>{t(`financing.status${c.status.charAt(0).toUpperCase() + c.status.slice(1)}`)}</span>
                </div>
                <div className="space-y-1.5">
                  {c.schedule.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <span className="text-gray-600 dark:text-gray-400">{new Date(r.dueDate).toLocaleDateString()}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{r.amount.toLocaleString()} XOF</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${REPAY_STATUS[r.status] || ""}`}>{t(`financing.repayStatus${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}</span>
                    </div>
                  ))}
                </div>
                {c.status === "active" && (
                  <button onClick={() => handleRepay(c.id)}
                    className="mt-3 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
                  >
                    {t("financing.repayNow")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && eligibility?.eligible && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Clock size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t("financing.noContracts")}</p>
        </div>
      )}
    </div>
  );
}
