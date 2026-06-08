import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneTilt, CurrencyCircleDollar, ArrowsLeftRight, SealCheck, X } from "@phosphor-icons/react";
import NegotiationBubble from "./NegotiationBubble";
import SmartCounterOffer from "./SmartCounterOffer";
import type { NegotiationSession, SmartSuggestion } from "../types/negotiation";
import { getSmartSuggestion } from "../services/negotiation";

interface Props {
  session: NegotiationSession;
  userId: string;
  userName: string;
  userRole: "buyer" | "producer";
  onSendMessage: (text: string, price?: number, volume?: number) => Promise<void>;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  sending?: boolean;
}

export default function NegotiationChat({
  session, userId, userName, userRole,
  onSendMessage, onAccept, onReject, sending,
}: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [counterMode, setCounterMode] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterVolume, setCounterVolume] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length]);

  const handleSmartSuggest = async () => {
    setSuggestLoading(true);
    setShowSuggest(true);
    try {
      const s = await getSmartSuggestion(session.crop, session.currentPrice);
      setSuggestion(s);
    } catch {
      /* noop */
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleApplySuggestion = (price: number) => {
    setCounterPrice(String(price));
    setCounterVolume(String(session.initialVolume));
    setCounterMode(true);
    setShowSuggest(false);
  };

  const handleSend = () => {
    if (!text.trim() && !counterPrice) return;
    const price = counterPrice ? Number(counterPrice) : undefined;
    const volume = counterVolume ? Number(counterVolume) : undefined;
    onSendMessage(text.trim() || (price ? `Contre-offre : ${price.toLocaleString("fr-FR")} FCFA/kg` : ""), price, volume);
    setText("");
    setCounterPrice("");
    setCounterVolume("");
    setCounterMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isActive = session.status === "active";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence>
          {session.messages.map((msg) => (
            <NegotiationBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === userId}
            />
          ))}
        </AnimatePresence>

        {showSuggest && (
          <div className="px-2 py-2">
            {suggestion ? (
              <SmartCounterOffer
                suggestion={suggestion}
                currentPrice={session.currentPrice}
                onApply={handleApplySuggestion}
                loading={suggestLoading}
              />
            ) : suggestLoading ? (
              <div className="animate-pulse bg-violet-50 rounded-xl p-4 border border-violet-200">
                <div className="h-4 bg-violet-200 rounded w-32 mb-3" />
                <div className="h-8 bg-violet-200 rounded w-full mb-2" />
                <div className="h-3 bg-violet-200 rounded w-48" />
              </div>
            ) : null}
          </div>
        )}

        {counterMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 p-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800">
                {t("negotiation.chat.counterOffer")}
              </span>
              <button onClick={() => setCounterMode(false)} className="text-amber-400 hover:text-amber-600">
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={t("negotiation.chat.pricePlaceholder")}
                className="flex-1 px-2.5 py-1.5 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                type="text"
                inputMode="numeric"
              />
              <input
                value={counterVolume}
                onChange={(e) => setCounterVolume(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={t("negotiation.chat.volumePlaceholder")}
                className="w-24 px-2.5 py-1.5 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                type="text"
                inputMode="numeric"
              />
            </div>
            {session.currentPrice !== Number(counterPrice) && Number(counterPrice) > 0 && (
              <p className="text-[10px] text-amber-600">
                {Number(counterPrice) > session.currentPrice ? "▲" : "▼"}{" "}
                {Math.abs(((Number(counterPrice) - session.currentPrice) / session.currentPrice) * 100).toFixed(1)}%{" "}
                {t("negotiation.chat.fromCurrent")}
              </p>
            )}
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {isActive && (
        <div className="border-t border-gray-100 p-3 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <button
              onClick={() => { setCounterMode(true); setShowSuggest(false); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
                counterMode
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <CurrencyCircleDollar size={12} />
              {t("negotiation.chat.counter")}
            </button>
            <button
              onClick={handleSmartSuggest}
              disabled={suggestLoading}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
                showSuggest
                  ? "bg-violet-100 border-violet-300 text-violet-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {suggestLoading ? (
                <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <SealCheck size={12} />
              )}
              {t("negotiation.chat.smart")}
            </button>
            <div className="flex-1" />
            <button
              onClick={onAccept}
              disabled={sending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {t("negotiation.chat.accept")}
            </button>
            <button
              onClick={onReject}
              disabled={sending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {t("negotiation.chat.reject")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("negotiation.chat.placeholder")}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50"
            />
            <motion.button
              onClick={handleSend}
              disabled={(!text.trim() && !counterPrice) || sending}
              className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl disabled:opacity-30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PaperPlaneTilt size={15} weight="fill" />
            </motion.button>
          </div>
        </div>
      )}

      {!isActive && (
        <div className="p-4 text-center border-t border-gray-100">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            session.status === "accepted" ? "bg-green-100 text-green-700" :
            session.status === "rejected" ? "bg-red-100 text-red-600" :
            "bg-gray-100 text-gray-500"
          }`}>
            {t(`negotiation.status.${session.status}`)}
          </span>
        </div>
      )}
    </div>
  );
}
