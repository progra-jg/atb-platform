import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getTrustScore } from "../services/trustScore";
import { SCORE_TIERS, UNLOCKABLE_FEATURES } from "../types/trustScore";
import type { TrustScore as TrustScoreType } from "../types/trustScore";
import {
  ShieldCheck, Star, CaretUp, Lock, LockOpen, ArrowRight,
} from "@phosphor-icons/react";

interface TrustScoreCardProps {
  onViewAll?: () => void;
}

function AnimatedScoreRing({ score, tierColor, size = 100 }: { score: number; tierColor: string; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 1000;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        opacity={0.1} color="currentColor"
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={tierColor} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function TrustScoreCard({ onViewAll }: TrustScoreCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [ts, setTs] = useState<TrustScoreType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const data = await getTrustScore(user.id);
      if (mounted) { setTs(data); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 18, width: "45%", background: colors.surfaceHover, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.surfaceHover, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: "60%", background: colors.surfaceHover, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 10, width: "40%", background: colors.surfaceHover, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!ts) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("trustScore.title")}
          </span>
        </div>
        <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", padding: "12px 0" }}>
          {t("trustScore.notAvailable")}
        </p>
      </div>
    );
  }

  const tierMeta = SCORE_TIERS[ts.tier];
  const tierColor = tierMeta.color;
  const unlockedCount = ts.unlockedFeatures.length;
  const totalFeatures = UNLOCKABLE_FEATURES.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color={tierColor} weight="fill" />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("trustScore.title")}
          </span>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: 8,
          background: `${tierColor}18`,
          color: tierColor, fontSize: 10, fontWeight: 700,
        }}>
          {t(tierMeta.labelKey)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <AnimatedScoreRing score={ts.score} tierColor={tierColor} size={80} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>
              {ts.score}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {ts.totalTrades} {t("trustScore.trades")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: colors.textMuted }}>
            <Star size={12} color="#fbbf24" weight="fill" /> {ts.positiveRatings}
            {ts.negativeRatings > 0 && <span style={{ color: colors.error }}>↓ {ts.negativeRatings}</span>}
          </div>
          {ts.nextTier && (
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
              {t("trustScore.toNextTier")} {t(SCORE_TIERS[ts.nextTier].labelKey)}: +{ts.scoreToNextTier}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{
        padding: "10px 12px", borderRadius: 10,
        background: colors.surfaceHover,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
          fontSize: 10, fontWeight: 600, color: colors.textMuted,
          textTransform: "uppercase", letterSpacing: "0.03em",
        }}>
          <span>{t("trustScore.unlockedFeatures")}</span>
          <span>{unlockedCount}/{totalFeatures}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {UNLOCKABLE_FEATURES.map((f) => {
            const unlocked = ts.unlockedFeatures.includes(f.key);
            return (
              <div key={f.key} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 6px", borderRadius: 6,
                background: unlocked ? `${tierColor}0c` : "transparent",
                opacity: unlocked ? 1 : 0.4,
              }}>
                <span style={{ fontSize: 12 }}>{unlocked ? "✅" : f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: unlocked ? 600 : 400, color: colors.text,
                  }}>
                    {t(f.labelKey)}
                  </div>
                  <div style={{ fontSize: 9, color: colors.textMuted }}>
                    {unlocked ? t(f.descKey) : `${t("trustScore.requires")} ${f.minScore}`}
                  </div>
                </div>
                {unlocked ? <LockOpen size={10} color={tierColor} /> : <Lock size={10} color={colors.textMuted} />}
              </div>
            );
          })}
        </div>
      </div>

      {onViewAll && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: `1px solid ${colors.borderLight}`,
          textAlign: "center",
        }}>
          <motion.button
            onClick={onViewAll}
            whileHover={{ gap: 10 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", color: colors.accent,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", padding: 0,
            }}
          >
            {t("trustScore.details")}
            <ArrowRight size={12} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
