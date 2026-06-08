import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor, switchLanguage } from "./utils";
import { SECTION_LINKS, ease } from "./data";
import useFocusTrap from "./useFocusTrap";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onScrollTo: (id: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function MobileMenu({ open, onClose, onScrollTo, onLogin, onRegister }: MobileMenuProps) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const focusTrapRef = useFocusTrap(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="presentation"
          style={{
            position: "fixed", inset: 0, zIndex: 101,
            background: "rgba(0,0,0,0.5)",
            WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
          }}>
          <motion.div
            ref={focusTrapRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.menu")}
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: "75vw", maxWidth: 320,
              background: colors.surface, padding: "20px 20px 32px",
              display: "flex", flexDirection: "column", gap: 4,
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={onClose}
                aria-label={t("common.close")}
                style={{
                  width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${alphaColor(isDark, 0.12)}`,
                  background: alphaColor(isDark, 0.03), color: alphaColor(isDark, 0.6),
                  cursor: "pointer", fontSize: 18, fontFamily: "inherit",
                }}>
                {"\u2715"}
              </button>
            </div>
            {SECTION_LINKS.map((link) => (
              <motion.button key={link.refId} onClick={() => { onScrollTo(link.refId); onClose(); }}
                whileHover={{ background: alphaColor(isDark, 0.04) }}
                style={{
                  padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                  border: "none", background: "transparent", color: alphaColor(isDark, 0.7),
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                {t(link.labelKey).slice(0, 14)}
              </motion.button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{
              display: "flex", gap: 8, padding: "8px 0",
              borderTop: `1px solid ${alphaColor(isDark, 0.06)}`, marginTop: 8,
            }}>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => switchLanguage(i18n)}
                aria-label={t("common.switchLanguage")}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px",
                  border: `1px solid ${alphaColor(isDark, 0.15)}`,
                  background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.7),
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                {t(i18n.language === "fr" ? "common.en" : "common.fr")}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { onLogin(); onClose(); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${alphaColor(isDark, 0.15)}`,
                  background: "transparent", color: alphaColor(isDark, 0.8),
                  cursor: "pointer", fontFamily: "inherit",
                }}>{t("auth.login")}</motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { onRegister(); onClose(); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: "none", background: colors.accentGradient, color: "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: colors.accentGlow,
                }}>{t("auth.register")}</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
