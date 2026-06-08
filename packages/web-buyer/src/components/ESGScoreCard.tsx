import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Users, ShieldCheck, Lightning, ArrowRight, Globe,
  CaretDown, CaretUp, FileText, SealCheck,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useProfileCompleteness } from "../hooks/useProfileCompleteness";
import Card, { CardHeader, CardDivider } from "./ui/Card";
import Button from "./ui/Button";
import Skeleton from "./Skeleton";
import {
  calculateESGScore, getRecommendations, getImpactBadges,
} from "../services/esg";
import type { ESGScore, ESGRecommendation, ESGImpactBadge } from "../types/esg";
import { ESG_TIERS } from "../types/esg";

function RingChart({ value, size = 80, stroke = 6, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function CategoryCard({ label, score, color, icon: Icon }: { label: string; score: number; color: string; icon: React.ElementType }) {
  const { colors } = useTheme();
  return (
    <div style={{
      flex: 1, borderRadius: 10, padding: "10px 8px", textAlign: "center",
      background: colors.surfaceHover,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color}18`, display: "flex",
        alignItems: "center", justifyContent: "center",
        margin: "0 auto 6px",
      }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{score}</div>
      <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{label}</div>
      <div style={{
        marginTop: 6, height: 4, borderRadius: 2, background: colors.borderLight,
        overflow: "hidden",
      }}>
        <motion.div
          style={{ height: "100%", borderRadius: 2, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

const IMPACT_ICONS: Record<string, React.ElementType> = {
  climate: Globe, community: Users, transparency: ShieldCheck, leader: Lightning,
};

export default function ESGScoreCard({ onViewAll }: { onViewAll?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { percentage } = useProfileCompleteness();
  const [score, setScore] = useState<ESGScore | null>(null);
  const [recommendations, setRecommendations] = useState<ESGRecommendation[]>([]);
  const [badges, setBadges] = useState<ESGImpactBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const esg = await calculateESGScore(user.id, percentage, user);
      setScore(esg);
      const [recs, bgs] = await Promise.all([
        getRecommendations(user.id, esg),
        getImpactBadges(esg),
      ]);
      setRecommendations(recs);
      setBadges(bgs);
    } finally {
      setLoading(false);
    }
  }, [user?.id, percentage, user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Card variant="premium">
        <CardHeader icon={<Leaf size={18} />} title={t("esg.title")} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "16px 0" }}>
          <Skeleton width={80} height={80} radius="50%" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="33%" height={60} radius={10} />)}
        </div>
      </Card>
    );
  }

  if (!score) return null;

  const tierInfo = ESG_TIERS.find((t) => t.tier === score.tier) ?? ESG_TIERS[ESG_TIERS.length - 1];
  const histColor = score.trend === "up" ? colors.success : score.trend === "down" ? colors.error : colors.textSecondary;
  const TrendIcon = score.trend === "up" ? CaretUp : score.trend === "down" ? CaretDown : null;

  return (
    <Card variant="premium">
      <CardHeader
        icon={<Leaf size={18} />}
        title={t("esg.title")}
        action={onViewAll && <Button variant="ghost" size="sm" onClick={onViewAll}>{t("common.viewAll")} →</Button>}
      />

      {/* Overall Score Ring */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <RingChart value={score.overall} size={72} stroke={5} color={tierInfo.color} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{score.overall}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: tierInfo.color, letterSpacing: "0.5px" }}>
              {score.tier.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("esg.overallLabel")}
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {t("esg.lastUpdated")}: {new Date(score.lastUpdated).toLocaleDateString()}
            {TrendIcon && <TrendIcon size={12} color={histColor} weight="fill" />}
          </div>
          <div style={{
            display: "inline-flex", marginTop: 6, padding: "2px 8px", borderRadius: 4,
            fontSize: 10, fontWeight: 700, background: `${tierInfo.color}18`, color: tierInfo.color,
          }}>
            {t(tierInfo.labelKey)}
          </div>
        </div>
      </div>

      {/* 3 Sub-scores */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <CategoryCard label={t("esg.environmental")} score={score.environmental} color="#2e9b4e" icon={Leaf} />
        <CategoryCard label={t("esg.social")} score={score.social} color="#1565c0" icon={Users} />
        <CategoryCard label={t("esg.governance")} score={score.governance} color="#e65100" icon={ShieldCheck} />
      </div>

      {/* Impact Badges */}
      {badges.filter((b) => b.unlocked).length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {badges.filter((b) => b.unlocked).map((b) => {
            const Icon = IMPACT_ICONS[b.badgeKey.replace("esg.badge.", "")] ?? SealCheck;
            return (
              <div key={b.badgeKey} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: colors.successLight, color: colors.success,
              }}>
                <Icon size={14} />
                {t(b.badgeKey)}
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle Factors */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 0", cursor: "pointer", fontSize: 12, fontWeight: 600,
          color: colors.textSecondary,
        }}
      >
        {t("esg.breakdown")}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
          <CaretDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginBottom: 12 }}>
              {score.factors.map((f, i) => (
                <div key={f.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{t(f.labelKey)}</span>
                    <span style={{ color: f.unlocked ? colors.success : colors.textMuted, fontWeight: 600 }}>
                      {f.score}/{f.maxScore}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: colors.borderLight, overflow: "hidden" }}>
                    <motion.div
                      style={{
                        height: "100%", borderRadius: 2,
                        background: f.score >= f.maxScore ? colors.success : f.score >= f.maxScore / 2 ? colors.warning : colors.borderLight,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(f.score / f.maxScore) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardDivider />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
            {t("esg.recommendations")}
          </div>
          {recommendations.slice(0, 3).map((r, i) => {
            const impactColor = r.impact === "high" ? colors.success : r.impact === "medium" ? colors.warning : colors.textMuted;
            const effortDots = r.effort === "easy" ? "★" : r.effort === "medium" ? "★★" : "★★★";
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                borderBottom: i < Math.min(recommendations.length, 3) - 1 ? `1px solid ${colors.borderLight}` : "none",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: impactColor, flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: 11, color: colors.text }}>{t(r.actionKey)}</div>
                {r.link && <ArrowRight size={12} color={colors.accent} />}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          {t("esg.viewReport")} <ArrowRight size={12} />
        </Button>
      </div>
    </Card>
  );
}
