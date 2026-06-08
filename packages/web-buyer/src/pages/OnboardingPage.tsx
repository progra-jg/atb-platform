import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Sparkle, ArrowRight, X, CaretLeft } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../hooks/useOnboarding";
import Logo from "../components/Logo";
import { ProfilStep } from "./steps/ProfilStep";
import { CompanyStep } from "./steps/CompanyStep";
import { InterestsStep } from "./steps/InterestsStep";
import { ContactStep } from "./steps/ContactStep";
import PushNotificationPrompt from "../components/PushNotificationPrompt";
import { STEP_VALIDATORS, OnboardingData } from "../types/onboarding";

const STEP_META = [
  { key: "profile", labelKey: "onboarding.wizard.step1", descKey: "onboarding.wizard.step1Desc", icon: Sparkle },
  { key: "company", labelKey: "onboarding.wizard.step2", descKey: "onboarding.wizard.step2Desc", icon: CheckCircle },
  { key: "interests", labelKey: "onboarding.wizard.step3", descKey: "onboarding.wizard.step3Desc", icon: CheckCircle },
  { key: "contact", labelKey: "onboarding.wizard.step4", descKey: "onboarding.wizard.step4Desc", icon: CheckCircle },
];

const STEPS = [ProfilStep, CompanyStep, InterestsStep, ContactStep];

function getUserTypeLabel(t: (k: string) => string, type: string): string {
  const map: Record<string, string> = {
    potential_buyer: "userTypePotential",
    active_buyer: "userTypeActive",
    farmer: "userTypeFarmer",
    other: "userTypeOther",
  };
  return t(`onboarding.wizard.${map[type] || "userTypePotential"}`);
}

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigate = useNavigate();
  const { data, save, saveImmediate } = useOnboarding();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const total = STEPS.length;
  const completedRef = useRef(completed);
  const loadingRef = useRef(loading);
  const stepRef = useRef(step);
  completedRef.current = completed;
  loadingRef.current = loading;
  stepRef.current = step;

  useEffect(() => {
    if (data.completed) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [data.completed, navigate]);

  const next = useCallback(() => {
    if (loadingRef.current) return;
    const s = stepRef.current;
    const validation = STEP_VALIDATORS[s](data);
    if (!validation.valid) {
      setErrorMsg(validation.messageKey ? t(validation.messageKey) : "");
      return;
    }
    setErrorMsg("");
    setDirection(1);
    setStep((prev) => Math.min(total - 1, prev + 1));
  }, [data, total]);

  const prev = useCallback(() => {
    setErrorMsg("");
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleComplete = async () => {
    if (loadingRef.current) return;
    const validation = STEP_VALIDATORS[total - 1](data);
    if (!validation.valid) {
      setErrorMsg(validation.messageKey ? t(validation.messageKey) : "");
      return;
    }
    setLoading(true);
    await saveImmediate({ completed: true });
    setLoading(false);
    setCompleted(true);
  };

  const handleSkip = async () => {
    if (loadingRef.current) return;
    setLoading(true);
    await saveImmediate({ completed: true });
    setLoading(false);
    setCompleted(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (completedRef.current) return;
      const curStep = stepRef.current;
      if (e.key === "Enter" && !loadingRef.current) {
        e.preventDefault();
        if (curStep === total - 1) handleComplete();
        else next();
      }
      if (e.key === "Escape" && !loadingRef.current) {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, handleComplete, handleSkip, total]);

  const goToDashboard = () => {
    const dest = data.userType === "farmer" ? "/producer" : "/dashboard";
    navigate(`${dest}?onboarded=true`, { replace: true });
  };

  if (completed) {
    const typeLabel = getUserTypeLabel(t, data.userType);
    return (
      <div style={{
        minHeight: "100vh", background: colors.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: isDark ? 0.04 : 0.02,
          background: `radial-gradient(circle at 30% 40%, ${colors.accent} 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, ${colors.accent}30 0%, transparent 40%)`,
        }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: colors.glassBg, backdropFilter: colors.glassBlur,
            WebkitBackdropFilter: colors.glassBlur,
            borderRadius: 24, border: `1px solid ${colors.glassBorder}`,
            boxShadow: `${colors.shadowXl}, ${colors.accentGlow}`,
            padding: "56px 48px", maxWidth: 460, width: "100%", margin: 20,
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: colors.successLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px", position: "relative",
            }}
          >
            <CheckCircle size={40} color={colors.success} weight="fill" />
            <motion.div
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: `2px solid ${colors.success}`,
              }}
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: colors.text, letterSpacing: "-0.5px" }}
          >
            {t("onboarding.wizard.complete")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            style={{ margin: "0 0 24px", fontSize: 13, color: colors.textMuted, lineHeight: 1.7 }}
          >
            {t("onboarding.wizard.completeDesc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 100,
              background: colors.accentLight, color: colors.accent,
              fontSize: 12, fontWeight: 600, marginBottom: 32,
            }}
          >
            <Sparkle size={14} weight="fill" />
            {typeLabel}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            style={{
              display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, textAlign: "left",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("onboarding.wizard.nextSteps")}
            </div>
            {[
              { icon: "🔍", label: t("onboarding.wizard.nextBrowse") },
              { icon: "📊", label: t("onboarding.wizard.nextAlerts") },
              { icon: "🏆", label: t("onboarding.wizard.nextProfile") },
            ].slice(0, data.userType === "farmer" ? 3 : data.userType === "other" ? 2 : 3).map((action, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                background: colors.statBg, border: `1px solid ${colors.borderLight}`,
              }}>
                <span style={{ fontSize: 16 }}>{action.icon}</span>
                <span style={{ fontSize: 12.5, color: colors.text, fontWeight: 500 }}>{action.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            style={{ marginBottom: 32 }}
          >
            <PushNotificationPrompt force onComplete={() => {}} />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            onClick={goToDashboard}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 36px", borderRadius: 12,
              border: "none", background: colors.accentGradient,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 4px 20px ${colors.accent}50`,
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 32px ${colors.accent}60`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 20px ${colors.accent}50`; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {t("onboarding.wizard.goDashboard")} <ArrowRight size={16} weight="bold" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const StepComponent = STEPS[step];
  const progress = ((step + 1) / total) * 100;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  const stepLabels = ["profile", "company", "interests", "contact"];

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg,
      display: "flex", position: "relative", overflow: "hidden",
    }}>
      {/* Ambient background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, ${colors.accent}08 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, ${colors.accent}06 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, ${isDark ? '#ffffff' : '#000000'}03 0%, transparent 40%)
        `,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.015,
        backgroundImage: `radial-gradient(2px 2px at ${30 + Math.random() * 40}% ${20 + Math.random() * 60}%, ${colors.accent} 0%, transparent 100%)`,
        backgroundSize: "60px 60px",
      }} />

      <div style={{
        display: "flex", width: "100%", maxWidth: 1060,
        margin: "0 auto", position: "relative", zIndex: 1,
        gap: 0, alignItems: "center", padding: 20,
      }}>
        {/* Left brand panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "none", flex: "0 0 280px",
            padding: "48px 32px",
            '@media (minWidth: 900px)': { display: "block" },
          } as any}
        >
          <Logo size={36} showText={false} />
          <div style={{ marginTop: 40, fontSize: 11, color: colors.textMuted, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const }}>
            {t("onboarding.wizard.title")}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginTop: 6, lineHeight: 1.3, letterSpacing: "-0.3px" }}>
            {t(`onboarding.wizard.${stepLabels[step]}Title`)}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
            {t(STEP_META[step].descKey)}
          </div>

          {/* Timeline */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 0 }}>
            {STEP_META.map((meta, i) => {
              const isActive = i === step;
              const isDone = i < step;
              const Icon = meta.icon;
              return (
                <div key={meta.key} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 0", opacity: isActive ? 1 : isDone ? 0.7 : 0.35,
                  transition: "opacity 0.3s",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: isDone ? colors.accent : (isActive ? `${colors.accent}18` : "transparent"),
                    border: `1.5px solid ${isDone ? colors.accent : (isActive ? colors.accent : colors.border)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.3s",
                  }}>
                    {isDone ? (
                      <CheckCircle size={12} color="#fff" weight="fill" />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? colors.accent : colors.textMuted }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: isActive ? 13 : 12, fontWeight: isActive ? 600 : 500, color: isDone ? colors.text : (isActive ? colors.text : colors.textMuted), transition: "all 0.3s" }}>
                    {t(meta.labelKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{
            flex: 1, maxWidth: 560, width: "100%",
            margin: "0 auto",
          }}
        >
          <div style={{
            background: colors.glassBg,
            backdropFilter: colors.glassBlur,
            WebkitBackdropFilter: colors.glassBlur,
            borderRadius: 20,
            border: `1px solid ${colors.glassBorder}`,
            boxShadow: `${colors.shadowXl}`,
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Top gradient line */}
            <motion.div
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}80)`,
                borderRadius: "0 2px 2px 0",
              }}
            />

            {/* Step header */}
            <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <motion.div
                  key={`title-${step}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: colors.accent,
                    padding: "2px 8px", borderRadius: 6,
                    background: `${colors.accent}12`,
                    letterSpacing: "0.3px",
                  }}>
                    {t("onboarding.wizard.step", { current: step + 1, total })}
                  </span>
                </motion.div>
                <motion.h2
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  style={{
                    margin: "8px 0 0", fontSize: 20, fontWeight: 700,
                    color: colors.text, letterSpacing: "-0.3px", lineHeight: 1.3,
                  }}
                >
                  {t(STEP_META[step].labelKey)}
                </motion.h2>
              </div>

              {!isFirst && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={prev}
                  disabled={loading}
                  style={{
                    background: "transparent", border: "none",
                    padding: "8px", borderRadius: 8,
                    cursor: loading ? "not-allowed" : "pointer",
                    color: colors.textMuted, display: "flex",
                    alignItems: "center", gap: 4, fontSize: 11,
                    fontFamily: "inherit", opacity: loading ? 0.4 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                >
                  <CaretLeft size={12} weight="bold" />
                  {t("onboarding.wizard.prev")}
                </motion.button>
              )}
            </div>

            {/* Step content */}
            <div style={{ padding: "20px 28px", minHeight: 240, position: "relative" }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StepComponent data={data} save={save} t={t} colors={colors} isDark={isDark} />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      marginTop: 16, fontSize: 11, fontWeight: 500,
                      color: colors.error, textAlign: "center",
                      padding: "8px 12px", borderRadius: 8,
                      background: `${colors.error}0c`,
                    }}
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", gap: 10, padding: "16px 28px 24px",
              borderTop: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{ flex: 1 }}>
                {step > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={prev}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "12px 0", borderRadius: 12,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                      background: "transparent",
                      color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                      fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.4 : 1, transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    {t("onboarding.wizard.prev")}
                  </motion.button>
                )}
              </div>
              <motion.button
                layout
                disabled={loading}
                onClick={isLast ? handleComplete : next}
                whileHover={loading ? {} : { scale: 1.02 }}
                whileTap={loading ? {} : { scale: 0.98 }}
                style={{
                  flex: 1, padding: "12px 24px", borderRadius: 12,
                  border: "none",
                  background: loading ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)") : colors.accentGradient,
                  color: loading ? colors.textMuted : "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "all 0.2s",
                  boxShadow: loading ? "none" : `0 2px 12px ${colors.accent}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {loading ? (
                  <span style={{
                    display: "inline-block", width: 16, height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 600ms linear infinite",
                    verticalAlign: "middle",
                  }} />
                ) : (
                  <>
                    {isLast ? t("onboarding.wizard.finish") : t("onboarding.wizard.next")}
                    {!isLast && <ArrowRight size={14} weight="bold" />}
                  </>
                )}
              </motion.button>
            </div>

            {/* Skip button */}
            <div style={{ textAlign: "center", padding: "0 28px 16px" }}>
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{
                  background: "transparent", border: "none",
                  padding: "6px 12px", borderRadius: 6,
                  fontSize: 11, fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", opacity: loading ? 0.4 : 1,
                  transition: "all 0.2s",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"; }}
              >
                <X size={10} weight="bold" />
                {t("onboarding.wizard.skip")}
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              textAlign: "center", marginTop: 16,
              fontSize: 10, color: colors.textMuted, opacity: 0.4,
              letterSpacing: "0.5px",
            }}
          >
            {t("onboarding.wizard.enterHint")} · {t("onboarding.wizard.escHint")}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
