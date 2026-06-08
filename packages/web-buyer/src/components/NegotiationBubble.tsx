import { motion } from "framer-motion";
import type { NegotiationMessage } from "../types/negotiation";
import { CheckCircle, XCircle, CurrencyCircleDollar, Chat } from "@phosphor-icons/react";

interface Props {
  message: NegotiationMessage;
  isOwn: boolean;
}

const TYPE_ICON = {
  text: Chat,
  proposal: CurrencyCircleDollar,
  counter: CurrencyCircleDollar,
  system: Chat,
  accept: CheckCircle,
  reject: XCircle,
  withdraw: XCircle,
} as const;

const TYPE_COLORS: Record<string, string> = {
  accept: "#22c55e",
  reject: "#ef4444",
  withdraw: "#6b7280",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function NegotiationBubble({ message, isOwn }: Props) {
  const Icon = TYPE_ICON[message.type] ?? Chat;
  const isStatus = ["accept", "reject", "withdraw"].includes(message.type);

  if (message.type === "system" || isStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-2"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
          <Icon size={12} color={TYPE_COLORS[message.type] ?? "#9ca3af"} weight="fill" />
          <span className="text-[11px] text-gray-500">{message.text}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`max-w-[75%] min-w-[180px] rounded-2xl px-3.5 py-2.5 ${
          isOwn
            ? "bg-emerald-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {!isOwn && (
          <p className="text-[10px] font-medium opacity-70 mb-0.5">{message.senderName}</p>
        )}
        <p className="text-[13px] leading-relaxed">{message.text}</p>
        {message.proposedPrice != null && (
          <div className={`mt-1.5 p-2 rounded-lg text-center ${
            isOwn ? "bg-white/15" : "bg-white/80"
          }`}>
            <p className={`text-lg font-bold ${isOwn ? "text-white" : "text-emerald-600"}`}>
              {message.proposedPrice.toLocaleString("fr-FR")}
              <span className="text-[10px] ml-1 font-normal">FCFA/kg</span>
            </p>
            {message.proposedVolume != null && (
              <p className={`text-[11px] ${isOwn ? "text-white/80" : "text-gray-500"}`}>
                {message.proposedVolume.toLocaleString("fr-FR")} kg
              </p>
            )}
          </div>
        )}
        {message.previousPrice != null && message.proposedPrice != null && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${
            isOwn ? "text-white/70" : "text-gray-400"
          }`}>
            <span>{message.proposedPrice > message.previousPrice ? "▲" : "▼"}</span>
            <span>
              {Math.abs(
                ((message.proposedPrice - message.previousPrice) / message.previousPrice) * 100,
              ).toFixed(1)}
              % vs pr\u00e9c\u00e9dent
            </span>
          </div>
        )}
        <p className={`text-[9px] mt-1 ${isOwn ? "text-white/60" : "text-gray-400"}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}
