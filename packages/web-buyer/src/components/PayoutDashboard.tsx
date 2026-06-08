import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { fetchPayouts, fetchPayoutStats, initiatePayout } from "../services/payout";
import type { PayoutRecord, PayoutStats } from "../types/payout";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PayoutDashboard() {
  const { t } = useTranslation();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", phone: "", provider: "mtn_momo" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, s] = await Promise.all([fetchPayouts(), fetchPayoutStats()]);
      setPayouts(p);
      setStats(s);
    } catch {
      setError(t("common.error"));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await initiatePayout({
        paymentId: "pay_manual",
        orderId: "ord_manual",
        producteurId: "prod_1",
        amount: Number(form.amount),
        method: "mobile_money",
        provider: form.provider,
        phone: form.phone,
      });
      setShowForm(false);
      setForm({ amount: "", phone: "", provider: "mtn_momo" });
      load();
    } catch (err: any) {
      setError(err.message || "Payout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ""}`}>
      {t(`payout.status${status.charAt(0).toUpperCase() + status.slice(1)}` as any)}
    </span>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("payout.payout")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          {t("payout.initiate")}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("payout.initiateTitle")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("payout.initiateDesc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("payout.amount")}</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("payout.phone")}</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+229 XX XX XX XX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("payout.provider")}</label>
              <select
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="mtn_momo">{t("payout.mtn")}</option>
                <option value="moov_flooz">{t("payout.moov")}</option>
                <option value="orange_money">{t("payout.orange")}</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium"
          >
            {submitting ? t("payout.processing") : t("payout.confirmPayout")}
          </button>
        </motion.form>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("payout.totalDisbursed"), value: `${(stats.totalDisbursed || 0).toLocaleString()} XOF` },
            { label: t("payout.totalTransactions"), value: stats.totalTransactions },
            { label: t("payout.successRate"), value: `${stats.successRate}%` },
            { label: t("payout.pendingCount"), value: stats.pendingCount },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("payout.history")}</h3>
        </div>
        {payouts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>{t("payout.emptyState")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">{t("payout.amount")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("payout.provider")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("payout.phone")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("payout.payoutMethod")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("common.status")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.amount.toLocaleString()} {p.currency}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{p.provider}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{p.phone}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t("payout.mobileMoney")}</td>
                    <td className="px-6 py-4">{statusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
