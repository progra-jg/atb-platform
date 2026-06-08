import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Package, User, Buildings, CurrencyCircleDollar, ArrowsLeftRight } from "@phosphor-icons/react";
import type { NegotiationSession } from "../types/negotiation";

interface Props {
  session: NegotiationSession;
  onShare?: () => void;
}

export default function NegotiationContextPanel({ session, onShare }: Props) {
  const { t } = useTranslation();

  const progress = ((session.currentPrice - session.initialPrice) / session.initialPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
        <h3 className="text-sm font-bold text-white">{session.crop}</h3>
        <p className="text-[11px] text-emerald-100 mt-0.5">{session.lotName}</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin size={14} className="text-gray-400" />
          {session.region}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <p className="text-[9px] text-gray-400 uppercase">{t("negotiation.context.initial")}</p>
            <p className="text-sm font-bold text-gray-800">
              {session.initialPrice.toLocaleString("fr-FR")}
              <span className="text-[9px] font-normal text-gray-400 ml-0.5">FCFA</span>
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <p className="text-[9px] text-gray-400 uppercase">{t("negotiation.context.current")}</p>
            <p className="text-sm font-bold text-emerald-700">
              {session.currentPrice.toLocaleString("fr-FR")}
              <span className="text-[9px] font-normal text-emerald-400 ml-0.5">FCFA</span>
            </p>
          </div>
        </div>

        {progress !== 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{t("negotiation.context.evolution")}</span>
              <span className={progress > 0 ? "text-red-500" : "text-green-500"}>
                {progress > 0 ? "+" : ""}{progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: progress > 0
                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                    : "linear-gradient(90deg, #22c55e, #10b981)",
                }}
                initial={{ width: "50%" }}
                animate={{ width: `${50 + progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase mb-2">{t("negotiation.context.participants")}</p>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <User size={12} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{session.buyerName}</p>
              <p className="text-[9px] text-gray-400 truncate">{session.buyerCompany}</p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
              {t("negotiation.context.buyer")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
              <Buildings size={12} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{session.producerName}</p>
              <p className="text-[9px] text-gray-400 truncate">{session.producerCooperative}</p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
              {t("negotiation.context.producer")}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{t("negotiation.context.volume")}</span>
            <span className="font-medium text-gray-800">
              {session.initialVolume.toLocaleString("fr-FR")} kg
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{t("negotiation.context.messages")}</span>
            <span className="font-medium text-gray-800">{session.messages.length}</span>
          </div>
        </div>

        {onShare && (
          <motion.button
            onClick={onShare}
            className="w-full py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <ArrowsLeftRight size={12} />
            {t("negotiation.context.share")}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
