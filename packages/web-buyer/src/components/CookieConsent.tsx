import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const COOKIE_CONSENT_KEY = "atb_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          role="dialog"
          aria-label={t("common.cookies.title")}
          style={{
            position: "fixed", bottom: 24, left: "50%", translateX: "-50%",
            zIndex: 9999, maxWidth: 720, width: "calc(100% - 32px)",
            background: colors.surfaceElevated,
            borderRadius: 16, padding: "20px 24px",
            border: `1px solid ${colors.border}`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.15), ${colors.shadowGlow}`,
            display: "flex", gap: 16, alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 4 }}>
              {t("common.cookies.title")}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
              {t("common.cookies.message")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={decline}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${colors.border}`, background: "transparent",
                color: colors.textSecondary, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t("common.cookies.decline")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={accept}
              style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: "none", background: colors.accentGradient,
                color: "#fff", cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 2px 8px ${colors.accent}44`,
              }}
            >
              {t("common.cookies.accept")}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SkipToContent() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      style={{
        position: "fixed", top: -100, left: 16, zIndex: 10000,
        padding: "8px 16px", borderRadius: 8,
        background: colors.accent, color: "#fff",
        fontSize: 13, fontWeight: 600, textDecoration: "none",
        transition: "top 0.2s ease",
        fontFamily: "inherit",
      }}
      onFocus={(e) => { e.currentTarget.style.top = "16px"; }}
      onBlur={(e) => { e.currentTarget.style.top = "-100px"; }}
    >
      {t("common.skipToContent")}
    </a>
  );
}

export function SectionErrorBoundary({ children, name }: { children: ReactNode; name: string }) {
  const [hasError, setHasError] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.error?.message?.includes?.(name)) {
        setHasError(true);
      }
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, [name]);

  if (hasError) {
    return (
      <div style={{
        padding: "40px 24px", textAlign: "center",
        background: colors.surface, borderRadius: 16,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <p style={{ fontSize: 13, color: colors.textMuted }}>
          {t("common.sectionError")}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
