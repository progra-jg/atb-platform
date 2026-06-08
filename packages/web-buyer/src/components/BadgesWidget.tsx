import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getBadgeState } from "../services/badges";
import { BADGE_CATALOG } from "../types/badge";
import type { BadgeState, BadgeDefinition, BadgeProgress } from "../types/badge";
import Card, { CardHeader } from "./ui/Card";
import { Trophy, Lock, Star } from "@phosphor-icons/react";

interface BadgesWidgetProps {
  onViewAll?: () => void;
}

const tierColors: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#a0aec0",
  gold: "#f6ad55",
  platinum: "#48bb78",
};

function BadgeCell({ def, progress, colors, t }: { def: BadgeDefinition; progress?: BadgeProgress; colors: ReturnType<typeof useTheme>["colors"]; t: (key: string) => string }) {
  const unlocked = progress?.unlocked ?? false;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      opacity: unlocked ? 1 : 0.4,
      transition: "opacity 0.3s",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: unlocked
          ? `${tierColors[def.tier]}22`
          : colors.surface,
        border: `1.5px solid ${unlocked ? tierColors[def.tier] : colors.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
        transition: "all 0.2s",
      }}>
        {unlocked ? def.icon : <Lock size={14} color={colors.textMuted} />}
      </div>
      <span style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", lineHeight: 1.2 }}>
        {t(def.labelKey)}
      </span>
    </div>
  );
}

export default function BadgesWidget({ onViewAll }: BadgesWidgetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [state, setState] = useState<BadgeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getBadgeState(user.id).then((s) => {
      setState(s);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) {
    return (
      <Card variant="premium">
        <CardHeader icon={<Trophy size={18} />} title={t("badges.widgetTitle")} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 10,
              background: colors.skeleton ?? colors.surface,
              animation: "shimmer 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      </Card>
    );
  }

  if (!state) return null;

  const nextBadgeDef = state.nextMilestone
    ? BADGE_CATALOG.find((b) => b.id === state.nextMilestone)
    : null;

  const nextBadgeProgress = state.nextMilestone
    ? state.badges.find((b) => b.badgeId === state.nextMilestone)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card variant="premium" onClick={onViewAll} style={{ cursor: onViewAll ? "pointer" : "default" }}>
        <CardHeader icon={<Trophy size={18} />} title={t("badges.widgetTitle")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            {t("badges.total", { unlocked: state.totalUnlocked, total: state.totalBadges })}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {BADGE_CATALOG.slice(0, 7).map((def) => (
              <BadgeCell
                key={def.id}
                def={def}
                progress={state.badges.find((b) => b.badgeId === def.id)}
                colors={colors}
                t={t}
              />
            ))}
          </div>
          {nextBadgeDef && nextBadgeProgress && !nextBadgeProgress.unlocked && (
            <div style={{
              marginTop: 8, padding: "10px 12px", borderRadius: 10,
              background: colors.surface, border: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={12} color={colors.accent} weight="fill" />
                {t("badges.nextMilestone")}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                {nextBadgeDef.icon} {t(nextBadgeDef.labelKey)} — {t(nextBadgeDef.descKey)}
              </div>
              <div style={{
                height: 6, borderRadius: 3,
                background: colors.borderLight,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${Math.round((nextBadgeProgress.progress / nextBadgeDef.maxProgress) * 100)}%`,
                  background: `linear-gradient(90deg, ${tierColors[nextBadgeDef.tier]}, ${colors.accent})`,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
