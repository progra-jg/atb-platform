import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { WifiHigh, WifiSlash, WarningCircle, X } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { subscribe, getState, forceCheck, type ConnectionQuality } from "../services/networkMonitor";

const QUALITY_CONFIG: Record<ConnectionQuality, { icon: typeof WifiHigh; labelKey: string; color: string; bg: string }> = {
  online: { icon: WifiHigh, labelKey: "connection.online", color: "#16a34a", bg: "#f0fdf4" },
  degraded: { icon: WarningCircle, labelKey: "connection.degraded", color: "#d97706", bg: "#fffbeb" },
  offline: { icon: WifiSlash, labelKey: "connection.offline", color: "#dc2626", bg: "#fef2f2" },
};

export default function ConnectionStatus() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [quality, setQuality] = useState<ConnectionQuality>(getState().quality);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = subscribe((s) => {
      setQuality(s.quality);
      if (s.quality === "online") setDismissed(false);
    });
    return unsub;
  }, []);

  const onRetry = useCallback(() => {
    setDismissed(false);
    forceCheck();
  }, []);

  if (quality === "online" && dismissed) return null;

  const cfg = QUALITY_CONFIG[quality];
  const Icon = cfg.icon;
  const isOffline = quality === "offline";

  if (quality === "online") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div
          role="alert"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", fontSize: 12,
            background: cfg.bg, color: cfg.color,
            borderBottom: `1px solid ${cfg.color}22`,
          }}
        >
          <Icon size={14} weight="fill" />
          <span style={{ flex: 1 }}>{t(cfg.labelKey)}</span>
          {isOffline && (
            <span
              onClick={onRetry}
              style={{
                cursor: "pointer", fontWeight: 600, fontSize: 11,
                textDecoration: "underline", textUnderlineOffset: 2,
              }}
            >
              {t("common.retry")}
            </span>
          )}
          {!isOffline && (
            <span
              onClick={() => setDismissed(true)}
              style={{ cursor: "pointer", display: "flex" }}
              aria-label={t("common.close")}
            >
              <X size={12} />
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
