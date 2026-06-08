import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, CaretRight, Check } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

const STEPS_KEY = "atb_tour_completed";

const STEPS = [
  "welcome",
  "browse",
  "filters",
  "alert",
  "purchase",
] as const;

export default function OnboardingTour() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STEPS_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const finish = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(STEPS_KEY, "1");
      setVisible(false);
    }, 300);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }, [step, finish]);

  if (!visible) return null;

  const s = STEPS[step];
  const total = STEPS.length;
  const isLast = step === total - 1;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              width: 380, maxWidth: "88vw", borderRadius: 20,
              background: `linear-gradient(145deg, ${colors.surface}, ${colors.statBg})`,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: `0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px ${colors.accent}15`,
              overflow: "hidden", position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: colors.borderLight }}>
              <motion.div
                initial={{ width: `${(step / total) * 100}%` }}
                animate={{ width: `${((step + 1) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${colors.accent}, #0d8a5a)`, borderRadius: 2 }}
              />
            </div>

            <button
              onClick={finish}
              style={{
                position: "absolute", top: 12, right: 12, width: 28, height: 28,
                borderRadius: "50%", border: "none", background: colors.statBg,
                color: colors.textMuted, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <X size={14} weight="bold" />
            </button>

            <div style={{ padding: "40px 28px 24px" }}>
              <motion.div
                key={`icon-${s}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
                  border: `1px solid ${colors.accent}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <span style={{ fontSize: 24 }}>{step === 0 ? "👋" : step === 1 ? "🔍" : step === 2 ? "🎯" : step === 3 ? "🔔" : "🛒"}</span>
              </motion.div>

              <motion.div
                key={`title-${s}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 6, letterSpacing: "-0.01em" }}
              >
                {t(`onboarding.${s}.title`)}
              </motion.div>

              <motion.div
                key={`desc-${s}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20, minHeight: 60 }}
              >
                {t(`onboarding.${s}.desc`)}
              </motion.div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? colors.accent : colors.borderLight,
                      opacity: i <= step ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10,
                      border: `1.5px solid ${colors.borderLight}`,
                      background: "transparent", color: colors.textSecondary,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s ease",
                    }}
                  >
                    {t("common.back")}
                  </button>
                )}
                <button
                  onClick={next}
                  style={{
                    flex: isLast && step > 0 ? 1 : 2, padding: "10px 0", borderRadius: 10,
                    border: "none", background: colors.accentGradient, color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: "inherit", transition: "all 0.15s ease",
                  }}
                >
                  {isLast ? (
                    <><Check size={14} weight="bold" /> {t("common.done")}</>
                  ) : (
                    <>{t("common.next")} <CaretRight size={12} weight="bold" /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
