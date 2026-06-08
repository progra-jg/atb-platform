import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Globe, House } from "@phosphor-icons/react";

export default function FloatingLangToggle() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  return (
    <motion.button
      onClick={() => { const l = i18n.language === "fr" ? "en" : "fr"; i18n.changeLanguage(l); localStorage.setItem("lang", l); }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={i18n.language === "fr" ? t("langToggle.switchToEN") : t("langToggle.switchToFR")}
      style={{
        position: "fixed", top: 16, right: 16, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 100, border: "none",
        cursor: "pointer", fontSize: 12, fontWeight: 700,
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(0,0,0,0.08)",
        fontFamily: "inherit",
      }}
    >
      <Globe size={14} weight="bold" />
      {i18n.language === "fr" ? t("common.en") : t("common.fr")}
    </motion.button>
  );
}

export function HomeButton() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <motion.a
      href="/"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={t("common.home")}
      style={{
        position: "fixed", top: 16, left: 16, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 100, border: "none",
        cursor: "pointer", fontSize: 12, fontWeight: 700,
        textDecoration: "none",
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(0,0,0,0.08)",
        fontFamily: "inherit",
      }}
    >
      <House size={14} weight="bold" aria-hidden="true" />
    </motion.a>
  );
}
