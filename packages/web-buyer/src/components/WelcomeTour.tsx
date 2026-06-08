import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

const TOUR_KEY = "atb_welcome_tour_done";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface Props {
  steps: TourStep[];
  autoStart?: boolean;
  onComplete?: () => void;
}

export default function WelcomeTour({ steps, autoStart, onComplete }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [active, setActive] = useState<number | null>(() => {
    if (!autoStart) return null;
    const done = localStorage.getItem(TOUR_KEY);
    return done === "true" ? null : 0;
  });

  const current = active !== null ? steps[active] : null;

  const dismiss = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setActive(null);
    onComplete?.();
  }, [onComplete]);

  const next = useCallback(() => {
    if (active !== null && active < steps.length - 1) {
      setActive(active + 1);
    } else {
      dismiss();
    }
  }, [active, steps.length, dismiss]);

  const prev = useCallback(() => {
    if (active !== null && active > 0) {
      setActive(active - 1);
    }
  }, [active]);

  if (active === null || !current) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.5)",
        pointerEvents: "all",
      }} onClick={dismiss} />

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: 380,
            background: colors.surface,
            borderRadius: 16,
            padding: "24px 20px 20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            pointerEvents: "all",
            border: `1px solid ${colors.borderLight}`,
          }}
        >
          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 10, right: 10,
              width: 28, height: 28, borderRadius: "50%",
              border: "none", background: colors.surfaceHover,
              color: colors.textMuted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={12} weight="bold" />
          </button>

          <div style={{
            width: 32, height: 4, borderRadius: 2,
            background: colors.statBg, marginBottom: 16,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              width: `${((active + 1) / steps.length) * 100}%`,
              height: "100%", background: colors.accent,
              borderRadius: 2, transition: "width 0.3s ease",
            }} />
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
            {current.title}
          </div>
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
            {current.description}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={prev}
              disabled={active === 0}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${colors.borderLight}`,
                background: "transparent",
                color: active === 0 ? colors.textMuted : colors.text,
                cursor: active === 0 ? "default" : "pointer",
                fontSize: 12, fontWeight: 600, opacity: active === 0 ? 0.4 : 1,
                fontFamily: "inherit",
              }}
            >
              <CaretLeft size={12} weight="bold" />
              {t("onboarding.wizard.prev")}
            </button>

            <button
              onClick={next}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 18px", borderRadius: 8,
                border: "none", background: colors.accentGradient,
                color: "#fff", cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              {active < steps.length - 1 ? t("onboarding.wizard.next") : t("common.done")}
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
