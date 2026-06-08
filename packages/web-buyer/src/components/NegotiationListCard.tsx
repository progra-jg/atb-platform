import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { User, Buildings, Chat, CurrencyCircleDollar, CheckCircle } from "@phosphor-icons/react";
import type { NegotiationSession } from "../types/negotiation";

interface Props {
  session: NegotiationSession;
  userId: string;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: "bg-green-100", text: "text-green-700", label: "negotiation.status.active" },
  accepted:  { bg: "bg-blue-100", text: "text-blue-700", label: "negotiation.status.accepted" },
  rejected:  { bg: "bg-red-100", text: "text-red-600", label: "negotiation.status.rejected" },
  withdrawn: { bg: "bg-gray-100", text: "text-gray-500", label: "negotiation.status.withdrawn" },
  expired:   { bg: "bg-gray-100", text: "text-gray-500", label: "negotiation.status.expired" },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function NegotiationListCard({ session, userId, onClick }: Props) {
  const { t } = useTranslation();
  const isBuyer = session.buyerId === userId;
  const otherName = isBuyer ? session.producerName : session.buyerName;
  const otherMeta = isBuyer ? session.producerCooperative : session.buyerCompany;
  const otherIcon = isBuyer ? Buildings : User;
  const Icon = otherIcon;
  const status = STATUS_STYLES[session.status] ?? STATUS_STYLES.active;
  const lastMsg = session.messages[session.messages.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-emerald-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate">{session.crop}</span>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>
            {t(status.label)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {t(isBuyer ? "negotiation.list.withProducer" : "negotiation.list.withBuyer")}{" "}
          <span className="font-medium text-gray-700">{otherName}</span>
          {otherMeta ? ` · ${otherMeta}` : ""}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <CurrencyCircleDollar size={10} />
            {session.currentPrice.toLocaleString("fr-FR")} FCFA
          </span>
          <span className="flex items-center gap-0.5">
            <Chat size={10} />
            {session.messages.length}
          </span>
          <span>{formatDate(session.updatedAt)}</span>
        </div>
      </div>

      {lastMsg?.proposedPrice != null && (
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-xs font-bold text-emerald-600">
            {lastMsg.proposedPrice.toLocaleString("fr-FR")}
          </p>
          <p className="text-[9px] text-gray-400">FCFA/kg</p>
        </div>
      )}

      <motion.div
        className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0"
        whileHover={{ x: 3 }}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M1 1L6 6L1 11" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
