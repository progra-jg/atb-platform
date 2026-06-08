import { useTranslation } from "react-i18next";
import { Coins } from "@phosphor-icons/react";
import FinancingDashboard from "../components/FinancingDashboard";

export default function FinancingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Coins size={28} className="text-amber-600 dark:text-amber-400" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("financing.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("financing.subtitle")}</p>
          </div>
        </div>
        <FinancingDashboard />
      </div>
    </div>
  );
}
