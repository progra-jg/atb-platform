import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Flame, Warning, Snowflake, Medal,
  CaretRight, CheckCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useStreak } from "../hooks/useStreak";
import { initStreakReminders } from "../services/streakReminder";
import Card, { CardHeader } from "./ui/Card";

const MILESTONE_ICONS: Record<number, string> = {
  3: "🔥",
  7: "⭐",
  14: "🏅",
  30: "🥈",
  60: "🥇",
  100: "👑",
  365: "💎",
};

function MilestoneIcon({ days, size }: { days: number; size?: number }) {
  const s = size ?? 16;
  if (days >= 100) return <Medal size={s} weight="fill" color="#ffd700" />;
  if (days >= 30) return <Medal size={s} weight="fill" color="#c0c0c0" />;
  return <Flame size={s} weight="fill" color="#ff6b35" />;
}

export default function StreakWidget() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    streak,
    longestStreak,
    freezes,
    isActiveToday,
    isAtRisk,
    nextMilestone,
    progressToNext,
    milestones,
    useFreeze: applyFreeze,
  } = useStreak();

  useEffect(() => {
    initStreakReminders();
  }, []);

  const achievedCount = milestones.filter((m) => m.achieved).length;
  const totalCount = milestones.length;

  return (
    <Card variant="premium">
      <CardHeader
        icon={<Flame size={18} weight="fill" color="#ff6b35" />}
        title={t("streak.title")}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: streak >= 30
              ? "linear-gradient(135deg, #ff6b35, #ffd700)"
              : streak >= 7
              ? "linear-gradient(135deg, #ff8c42, #ff6b35)"
              : "linear-gradient(135deg, #ffa05c, #ff6b35)",
            boxShadow: `0 0 20px ${streak >= 30 ? "#ffd70044" : streak >= 7 ? "#ff6b3544" : "#ff8c4244"}`,
            flexShrink: 0,
          }}
        >
          <motion.span
            key={streak}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
            style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}
          >
            {streak}
          </motion.span>
          {isActiveToday && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: colors.success,
                border: `2px solid ${colors.surface}`,
              }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>
            {t("streak.days", { count: streak })}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
            {t("streak.longest", { count: longestStreak })}
          </div>
          {nextMilestone && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: colors.textMuted, marginBottom: 3 }}>
                <CaretRight size={8} />
                <span>{t(nextMilestone.labelKey)}</span>
                <span style={{ marginLeft: "auto", fontWeight: 600, color: colors.textSecondary }}>
                  {progressToNext}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 2,
                  background: colors.borderLight,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #ff6b35, #ffd700)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAtRisk && streak > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              background: `${colors.warning}0c`,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <Warning size={14} color={colors.warning} weight="fill" />
            <span style={{ fontSize: 10, color: colors.text, fontWeight: 500, flex: 1 }}>
              {t("streak.atRisk")}
            </span>
            {freezes > 0 && (
              <button
                onClick={applyFreeze}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.warning}44`,
                  background: `${colors.warning}08`,
                  color: colors.warning,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Snowflake size={10} weight="bold" />
                {t("streak.useFreeze")} ({freezes})
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {streak === 0 && freezes > 0 && (
        <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", padding: "4px 0 8px" }}>
          <Snowflake size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {t("streak.freezes", { count: freezes })}
        </div>
      )}

      {achievedCount > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {milestones
            .filter((m) => m.achieved)
            .slice(-5)
            .map((m) => (
              <div
                key={m.days}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  background: `${colors.accent}0c`,
                  color: colors.accent,
                }}
              >
                <CheckCircle size={8} weight="fill" />
                {m.days}d
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
