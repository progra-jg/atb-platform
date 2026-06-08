import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  WhatsappLogo, ShareNetwork, Check, ArrowElbowDownRight, CopySimple,
} from "@phosphor-icons/react";
import { recordShare } from "../services/referralV2";
import { generateWhatsAppMessage } from "../services/whatsappBridge";
import { getCropEmoji, formatTrend } from "../types/referralV2";

interface WhatsAppShareButtonProps {
  crop: string;
  price: number;
  change: number;
  size?: number;
  label?: string;
  variant?: "icon" | "chip" | "full";
}

const chipHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
  tap: { scale: 0.97 },
};

export default function WhatsAppShareButton({
  crop, price, change, size = 18, label, variant = "icon",
}: WhatsAppShareButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const emoji = getCropEmoji(crop);
  const trend = formatTrend(change);
  const cropDisplay = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();

  const handleWhatsApp = async () => {
    const userId = user?.id ?? "anonymous";
    const share = await recordShare(userId, crop, price, change);
    const link = generateWhatsAppMessage(crop, price, change, share.refCode);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); }, 1200);
    window.open(`https://wa.me/?text=${encodeURIComponent(link.message)}`, "_blank");
  };

  const handleCopyLink = async () => {
    const userId = user?.id ?? "anonymous";
    const share = await recordShare(userId, crop, price, change);
    const link = generateWhatsAppMessage(crop, price, change, share.refCode);
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1200);
  };

  if (variant === "chip") {
    return (
      <motion.button
        onClick={handleWhatsApp}
        variants={chipHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 20,
          border: `1px solid ${colors.borderLight}`,
          background: sent ? "rgba(37,211,102,0.1)" : colors.surface,
          color: sent ? "#25D366" : colors.text,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          fontFamily: "inherit", whiteSpace: "nowrap",
          transition: "all 0.2s",
        }}
      >
        {sent ? <Check size={14} weight="bold" /> : <WhatsappLogo size={14} color="#25D366" weight="fill" />}
        {sent ? t("share.sent") : (label ?? t("share.share"))}
      </motion.button>
    );
  }

  if (variant === "full") {
    return (
      <motion.button
        onClick={handleWhatsApp}
        variants={chipHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "10px 16px", borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
        }}
      >
        <WhatsappLogo size={18} weight="fill" />
        {label ?? t("share.whatsappShare")}
      </motion.button>
    );
  }

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={t("share.sharePrice")}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 6,
          display: "flex", color: colors.textMuted, borderRadius: 8,
          transition: "color 0.2s",
        }}
      >
        <ShareNetwork size={size} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "100%", right: 0, zIndex: 50,
              marginTop: 8, minWidth: 260,
              background: colors.surface, borderRadius: 14,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
              padding: 0, overflow: "hidden",
            }}
          >
            <div style={{
              padding: "12px 14px 10px",
              borderBottom: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: colors.textMuted,
                textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8,
              }}>
                {t("share.preview")}
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", borderRadius: 10,
                background: colors.surfaceHover,
              }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 13, color: colors.text,
                    lineHeight: 1.3,
                  }}>
                    {cropDisplay}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{
                      fontWeight: 700, fontSize: 15, color: colors.text,
                    }}>
                      {price.toLocaleString("fr-FR")} FCFA
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: change >= 0 ? "#22c55e" : "#ef4444",
                    }}>
                      {trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: 6 }}>
              <button onClick={handleWhatsApp}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 8, border: "none",
                  background: "transparent", color: colors.text, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {sent
                  ? <Check size={16} color="#25D366" weight="bold" />
                  : <WhatsappLogo size={16} color="#25D366" weight="fill" />
                }
                {sent ? t("share.sent") : t("share.whatsapp")}
              </button>
              <button onClick={handleCopyLink}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 8, border: "none",
                  background: "transparent", color: colors.text, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {copied
                  ? <Check size={16} color={colors.success} weight="bold" />
                  : <CopySimple size={16} />
                }
                {copied ? t("share.copied") : t("share.copyLink")}
              </button>
            </div>

            <div style={{
              padding: "8px 14px 10px",
              borderTop: `1px solid ${colors.borderLight}`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <ArrowElbowDownRight size={12} color={colors.textMuted} />
              <span style={{ fontSize: 10, color: colors.textMuted, lineHeight: 1.3 }}>
                {t("share.refTracking")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
