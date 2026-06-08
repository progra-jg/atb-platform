import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { ShareNetwork, WhatsappLogo, Envelope, Link as LinkIcon, Check, X } from "@phosphor-icons/react";

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  size?: number;
}

export default function ShareButton({ title, url, description, size = 20 }: ShareButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = description ? encodeURIComponent(description) : "";

  const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20%E2%80%94%20${encodedDesc ? `${encodedDesc}%20` : ""}${encodedUrl}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDesc ? `${encodedDesc}%0A%0A` : ""}${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={t("share.button")}
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
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "100%", right: 0, zIndex: 50,
              marginTop: 6, minWidth: 190,
              background: colors.surface, borderRadius: 12,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              padding: 6, overflow: "hidden",
            }}
          >
            <button onClick={() => { window.open(whatsappUrl, "_blank"); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", borderRadius: 8, border: "none",
                background: "transparent", color: colors.text, fontSize: 12, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <WhatsappLogo size={16} color="#25D366" /> {t("share.whatsapp")}
            </button>
            <button onClick={() => { window.open(emailUrl, "_blank"); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", borderRadius: 8, border: "none",
                background: "transparent", color: colors.text, fontSize: 12, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Envelope size={16} /> {t("share.email")}
            </button>
            <button onClick={handleCopyLink}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", borderRadius: 8, border: "none",
                background: "transparent", color: colors.text, fontSize: 12, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {copied ? <Check size={16} color={colors.success} /> : <LinkIcon size={16} />}
              {copied ? t("share.copied") : t("share.copyLink")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
