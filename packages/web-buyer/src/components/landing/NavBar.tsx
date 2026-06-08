import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor, switchLanguage } from "./utils";
import { SECTION_LINKS, ease } from "./data";
import Logo from "../Logo";

interface NavBarProps {
  isMobile: boolean;
  navSolid: boolean;
  onScrollTo: (id: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onToggleTheme: () => void;
  onToggleMenu: () => void;
}

export default function NavBar({
  isMobile, navSolid, onScrollTo, onLogin, onRegister, onToggleTheme, onToggleMenu,
}: NavBarProps) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, display: "flex", alignItems: "center",
        padding: "0 24px", gap: isMobile ? 6 : 20,
        paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined,
        background: navSolid ? (isDark ? "rgba(10,13,11,0.85)" : "rgba(247,245,241,0.8)") : "transparent",
        backdropFilter: navSolid ? "blur(20px)" : "none",
        WebkitBackdropFilter: navSolid ? "blur(20px)" : "none",
        borderBottom: navSolid ? `1px solid ${alphaColor(isDark, 0.06)}` : "none",
        transition: "background 0.4s ease, border 0.4s ease",
      }}>
      <div style={{ flex: "1 1 30%", display: "flex", alignItems: "center" }}>
        <motion.div whileHover={{ scale: 1.02 }} style={{ cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Logo size={isMobile ? 28 : 32} showText color={isDark ? "#fff" : colors.text} />
        </motion.div>
      </div>
      {!isMobile && (
      <div style={{ flex: "0 1 auto", display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
        {SECTION_LINKS.map((link) => (
          <motion.button key={link.refId} onClick={() => onScrollTo(link.refId)}
            whileHover={{ color: alphaColor(isDark, 0.9) }}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
              border: "none", background: "transparent", color: alphaColor(isDark, 0.6),
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.2px",
              whiteSpace: "nowrap",
            }}>
            {t(link.labelKey).slice(0, 14)}
          </motion.button>
        ))}
      </div>
      )}
      <div style={{ flex: "1 1 30%", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: isMobile ? 4 : 6 }}>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => switchLanguage(i18n)}
        aria-label={t("common.switchLanguage")}
        style={{
          padding: "4px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
          border: `1px solid ${alphaColor(isDark, 0.15)}`,
          background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.7),
          cursor: "pointer", fontFamily: "inherit",
        }}>
        {i18n.language === "fr" ? "EN" : "FR"}
      </motion.button>
      {!isMobile && (
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggleTheme}
        aria-label={t("common.toggleTheme")}
        style={{
          width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${alphaColor(isDark, 0.15)}`,
          background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.7),
          cursor: "pointer", fontSize: 13, fontFamily: "inherit",
        }}>
        {isDark ? "\u2600" : "\u263D"}
      </motion.button>
      )}
      {!isMobile && (
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={onLogin}
        style={{
          padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
          border: `1px solid ${alphaColor(isDark, 0.15)}`,
          background: "transparent", color: alphaColor(isDark, 0.8),
          cursor: "pointer", fontFamily: "inherit",
        }}>{t("auth.login")}</motion.button>
      )}
      {!isMobile && (
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={onRegister}
        style={{
          padding: "7px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
          border: "none", background: colors.accentGradient, color: "#fff",
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: colors.accentGlow,
        }}>{t("auth.register")}</motion.button>
      )}
      {isMobile && (
      <motion.button whileTap={{ scale: 0.95 }}
        onClick={onToggleTheme}
        aria-label={t("common.toggleTheme")}
        style={{
          width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${alphaColor(isDark, 0.15)}`,
          background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.7),
          cursor: "pointer", fontSize: 15, fontFamily: "inherit",
        }}>
        {isDark ? "\u2600" : "\u263D"}
      </motion.button>
      )}
      {isMobile && (
      <motion.button whileTap={{ scale: 0.95 }}
        onClick={onToggleMenu}
        aria-label={t("common.menu")}
        aria-expanded={false}
        style={{
          width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${alphaColor(isDark, 0.15)}`,
          background: alphaColor(isDark, 0.04), color: alphaColor(isDark, 0.7),
          cursor: "pointer", fontSize: 18, fontFamily: "inherit",
        }}>
        {"\u2630"}
      </motion.button>
      )}
    </div>
    </motion.nav>
  );
}
