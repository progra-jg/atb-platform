import React from "react";
import { useTranslation } from "react-i18next";
import { CurrencyCircleDollar } from "@phosphor-icons/react";
import PayoutDashboard from "../components/PayoutDashboard";

export default function PayoutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
            <CurrencyCircleDollar size={28} className="text-green-600 dark:text-green-400" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("payout.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("payout.subtitle")}</p>
          </div>
        </div>
        <PayoutDashboard />
      </div>
    </div>
  );
}
