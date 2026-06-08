import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { DownloadSimple, X, Lightning, WifiSlash, ClockCounterClockwise } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

const DISMISS_TMP_KEY = "atb_pwa_dismiss_tmp";

export default function InstallPrompt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [delayPast, setDelayPast] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (mounted.current && !localStorage.getItem("atb_pwa_dismissed") && !localStorage.getItem(DISMISS_TMP_KEY)) {
        setPrompt(e as BeforeInstallPromptEvent);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    setTimeout(() => {
      if (mounted.current) setDelayPast(true);
    }, 4000);
    return () => {
      mounted.current = false;
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    if (prompt && delayPast && !show) {
      setShow(true);
    }
  }, [prompt, delayPast, show]);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
      localStorage.setItem("atb_pwa_installed", "1");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("atb_pwa_dismissed", "1");
  };

  const handleLater = () => {
    setShow(false);
    localStorage.setItem(DISMISS_TMP_KEY, "1");
    setTimeout(() => {
      localStorage.removeItem(DISMISS_TMP_KEY);
      if (mounted.current && prompt) setShow(true);
    }, 7 * 86400000);
  };

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isInstalled = localStorage.getItem("atb_pwa_installed");

  if (isStandalone || isInstalled || !show) return null;

  const benefits = [
    { icon: Lightning, label: t("pwa.benefitFast") },
    { icon: WifiSlash, label: t("pwa.benefitOffline") },
    { icon: ClockCounterClockwise, label: t("pwa.benefitQuick") },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        style={{
          position: "fixed", bottom: 16, left: 16, right: 16,
          maxWidth: 380, margin: "0 auto", zIndex: 9999,
          background: colors.surfaceElevated,
          borderRadius: 14,
          boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px ${colors.accent}15`,
          border: `1px solid ${colors.border}`,
          padding: 16, overflow: "hidden",
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute", top: 8, right: 8,
            width: 28, height: 28, borderRadius: 6,
            border: "none", background: "transparent",
            color: colors.textSecondary, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label={t("common.close")}
        >
          <X size={14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: `0 4px 12px ${colors.accent}40`,
          }}>
            <DownloadSimple size={22} color="#fff" weight="bold" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
              {t("pwa.installTitle")}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 1 }}>
              {t("pwa.installDesc")}
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 6, marginBottom: 12,
        }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 4,
              padding: "5px 8px", borderRadius: 8,
              background: colors.statBg, fontSize: 10,
              color: colors.textMuted, fontWeight: 500,
            }}>
              <b.icon size={10} color={colors.accent} />
              {b.label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleInstall}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8,
              border: "none", background: colors.accentGradient,
              color: "#fff", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("pwa.install")}
          </button>
          <button
            onClick={handleLater}
            style={{
              padding: "9px 14px", borderRadius: 8,
              border: `1px solid ${colors.borderLight}`,
              background: "transparent",
              color: colors.textSecondary, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            {t("pwa.later")}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
