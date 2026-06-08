import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import NegotiationChat from "./NegotiationChat";
import NegotiationContextPanel from "./NegotiationContextPanel";
import { sendMessage, updateSessionStatus } from "../services/negotiation";
import { generateWhatsAppMessage } from "../services/whatsappBridge";
import type { NegotiationSession } from "../types/negotiation";
import { useTheme } from "../context/ThemeContext";
import { ArrowsLeftRight, ArrowLeft, CheckCircle, WarningCircle } from "@phosphor-icons/react";

interface Props {
  session: NegotiationSession;
  userId: string;
  userName: string;
  userRole: "buyer" | "producer";
  onBack: () => void;
  onSessionUpdate: (session: NegotiationSession) => void;
}

export default function NegotiationWorkspace({ session: initial, userId, userName, userRole, onBack, onSessionUpdate }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [session, setSession] = useState(initial);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = async (text: string, price?: number, volume?: number) => {
    setSending(true);
    try {
      const updated = await sendMessage(session.id, userId, userName, userRole, text, price, volume);
      setSession(updated);
      onSessionUpdate(updated);
    } catch {
      showToast("error", t("negotiation.error.send"));
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    setSending(true);
    try {
      const updated = await updateSessionStatus(session.id, "accepted", userId, userName);
      setSession(updated);
      onSessionUpdate(updated);
      showToast("success", t("negotiation.toast.accepted"));
    } catch {
      showToast("error", t("negotiation.error.accept"));
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    setSending(true);
    try {
      const updated = await updateSessionStatus(session.id, "rejected", userId, userName);
      setSession(updated);
      onSessionUpdate(updated);
      showToast("success", t("negotiation.toast.rejected"));
    } catch {
      showToast("error", t("negotiation.error.reject"));
    } finally {
      setSending(false);
    }
  };

  const handleShare = () => {
    const link = generateWhatsAppMessage(
      session.crop,
      session.currentPrice,
      ((session.currentPrice - session.initialPrice) / session.initialPrice) * 100,
      "",
    );
    const url = `https://wa.me/?text=${encodeURIComponent(link.message + `\n\nNégociation: ${session.id}`)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 truncate">{session.crop}</h2>
          <p className="text-[11px] text-gray-400 truncate">
            {session.producerName} · {session.currentPrice.toLocaleString("fr-FR")} FCFA/kg
          </p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          session.status === "active" ? "bg-green-100 text-green-700" :
          session.status === "accepted" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-500"
        }`}>
          {t(`negotiation.status.${session.status}`)}
        </span>
      </div>

      <div className="flex-1 flex" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col bg-gray-50">
          <NegotiationChat
            session={session}
            userId={userId}
            userName={userName}
            userRole={userRole}
            onSendMessage={handleSendMessage}
            onAccept={handleAccept}
            onReject={handleReject}
            sending={sending}
          />
        </div>
        <div className="hidden lg:block w-72 border-l border-gray-100 overflow-y-auto">
          <NegotiationContextPanel session={session} onShare={handleShare} />
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg z-50 ${
              toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
