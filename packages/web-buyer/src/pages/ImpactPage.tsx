import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Leaf, Users, ShieldCheck, CaretUp, CaretDown, ArrowRight,
  ShareNetwork, DownloadSimple, SealCheck, Lightning, Clock, TrendUp, ShoppingCart,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useProfileCompleteness } from "../hooks/useProfileCompleteness";
import { useIsMobile } from "../hooks/useMediaQuery";
import { calculateESGScore } from "../services/esg";
import { recordSnapshot, getHistory, generateMilestones, getTrend } from "../services/impactTracker";
import Card, { CardHeader, CardDivider } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/Skeleton";
import type { ImpactSnapshot, MilestoneEvent, ImpactHistory } from "../types/impact";
import { ESG_TIERS } from "../types/esg";

function RingChart({ value, size = 120, stroke = 8, color }: { value: number; size?: number; stroke?: number; color: string }) {
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
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

function HistoryChart({ snapshots }: { snapshots: ImpactSnapshot[] }) {
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const w = isMobile ? 300 : 500;
  const h = 140;
  const pad = { top: 20, right: 16, bottom: 24, left: 36 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  if (snapshots.length < 2) {
    return (
      <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: colors.textMuted }}>
        {snapshots.length === 1 ? "Plus de données nécessaires pour l'historique" : "Aucun historique disponible"}
      </div>
    );
  }

  const values = snapshots.map((s) => s.overall);
  const min = Math.max(0, Math.min(...values) - 10);
  const max = Math.min(100, Math.max(...values) + 10);
  const xScale = (i: number) => pad.left + (i / Math.max(snapshots.length - 1, 1)) * cw;
  const yScale = (v: number) => pad.top + ch - ((v - min) / (max - min)) * ch;

  const lineD = values.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`).join(" ");

  const areaD = `${lineD} L${xScale(values.length - 1)},${pad.top + ch} L${xScale(0)},${pad.top + ch} Z`;

  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const v = min + ((max - min) / (ticks - 1)) * i;
    return { v: Math.round(v), y: yScale(v) };
  });

  const xLabels = snapshots.filter((_, i) => {
    if (snapshots.length <= 6) return true;
    return i % Math.ceil(snapshots.length / 6) === 0 || i === snapshots.length - 1;
  });

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} y1={t.y} x2={w - pad.right} y2={t.y} stroke={colors.borderLight} strokeWidth={1} />
          <text x={pad.left - 6} y={t.y + 3} textAnchor="end" fill={colors.textMuted} fontSize={9}>{t.v}</text>
        </g>
      ))}
      <path d={areaD} fill={`${colors.accent}0c`} />
      <motion.path
        d={lineD} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {values.map((v, i) => (
        <motion.circle
          key={i} cx={xScale(i)} cy={yScale(v)} r={3.5}
          fill={colors.surface} stroke={colors.accent} strokeWidth={2}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 3.5 }}
          transition={{ delay: 0.8 + i * 0.05 }}
        />
      ))}
      {xLabels.map((s, i) => {
        const idx = snapshots.indexOf(s);
        return (
          <text key={i} x={xScale(idx)} y={h - 4} textAnchor="middle" fill={colors.textMuted} fontSize={8}>
            {new Date(s.date).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })}
          </text>
        );
      })}
    </svg>
  );
}

function Timeline({ milestones }: { milestones: MilestoneEvent[] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (milestones.length === 0) return null;
  const sorted = [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div style={{ position: "relative" }}>
      {sorted.map((m, i) => (
        <div key={m.id} style={{
          display: "flex", gap: 12, paddingBottom: i < sorted.length - 1 ? 14 : 0,
          position: "relative", marginLeft: 8,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: colors.accentLight, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 11,
            }}>
              {m.icon}
            </div>
            {i < sorted.length - 1 && <div style={{ width: 1.5, flex: 1, background: colors.borderLight, marginTop: 4 }} />}
          </div>
          <div style={{ paddingBottom: i < sorted.length - 1 ? 0 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{t(m.labelKey)}</div>
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
              {new Date(m.date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ImpactPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { percentage } = useProfileCompleteness();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<ImpactSnapshot | null>(null);
  const [history, setHistory] = useState<ImpactHistory>({ snapshots: [], milestones: [] });
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const esg = await calculateESGScore(user.id, percentage, user);
      const current = await recordSnapshot(user.id, esg, percentage);
      setSnapshot(current);
      setHistory(getHistory());
      const ms = await generateMilestones(user.id);
      setMilestones(ms);
    } finally {
      setLoading(false);
    }
  }, [user?.id, percentage, user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Skeleton width={200} height={28} mb={8} />
        <Skeleton width={320} height={14} mb={24} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
          <Skeleton height={260} radius={16} />
          <Skeleton height={260} radius={16} />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: colors.textSecondary }}>{t("common.loading")}</div>
      </div>
    );
  }

  const allSnapshots = history.snapshots;
  const trend = getTrend(allSnapshots);
  const tierInfo = ESG_TIERS.find((t) => t.tier === snapshot.tier) ?? ESG_TIERS[ESG_TIERS.length - 1];
  const TrendIcon = trend.direction === "up" ? CaretUp : trend.direction === "down" ? CaretDown : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 12px" : "24px 16px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, letterSpacing: "-0.5px" }}>
          {t("impact.title")}
        </div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
          {t("impact.subtitle")}
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginTop: 24 }}>
        {/* Score Overview */}
        <Card variant="premium">
          <CardHeader icon={<Leaf size={18} />} title={t("esg.title")} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "4px 0 12px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <RingChart value={snapshot.overall} size={100} stroke={7} color={tierInfo.color} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{snapshot.overall}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: tierInfo.color, letterSpacing: "0.5px" }}>
                  {snapshot.tier.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t(tierInfo.labelKey)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {TrendIcon && <TrendIcon size={14} color={trend.direction === "up" ? colors.success : colors.error} weight="fill" />}
                <span style={{ fontSize: 12, color: trend.direction === "up" ? colors.success : trend.direction === "down" ? colors.error : colors.textSecondary }}>
                  {trend.change > 0 ? `+${trend.change}` : trend.change} pts
                </span>
                <span style={{ fontSize: 11, color: colors.textMuted }}>{t("impact.total")}</span>
              </div>
              <div style={{
                display: "flex", gap: 12, marginTop: 10,
              }}>
                {([
                  { label: t("esg.environmental"), value: snapshot.environmental, color: "#2e9b4e" },
                  { label: t("esg.social"), value: snapshot.social, color: "#1565c0" },
                  { label: t("esg.governance"), value: snapshot.governance, color: "#e65100" },
                ] as const).map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Summary */}
        <Card variant="premium">
          <CardHeader icon={<Lightning size={18} />} title={t("impact.stats")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: t("impact.badgesUnlocked"), value: `${snapshot.badgesUnlocked}`, icon: SealCheck, color: colors.accent },
              { label: t("impact.profileScore"), value: `${snapshot.profilePercentage}%`, icon: ShieldCheck, color: colors.success },
              { label: t("impact.tier"), value: snapshot.tier.toUpperCase(), icon: Leaf, color: tierInfo.color },
              { label: t("impact.snapshots"), value: `${allSnapshots.length}`, icon: Clock, color: colors.warning },
            ] as const).map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px", borderRadius: 10,
                background: colors.surfaceHover,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${s.color}18`, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <s.icon size={14} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* History Chart */}
      <Card variant="premium" style={{ marginTop: 24 }}>
        <CardHeader
          icon={<TrendUp size={18} />}
          title={t("impact.history")}
          subtitle={allSnapshots.length > 1 ? t("impact.lastSnapshots", { count: allSnapshots.length }) : undefined}
        />
        <HistoryChart snapshots={allSnapshots} />
      </Card>

      {/* Two-column: Timeline + Factors */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginTop: 24 }}>
        {/* Milestones Timeline */}
        <Card variant="premium">
          <CardHeader icon={<Clock size={18} />} title={t("impact.milestones")} />
          {milestones.length > 0 ? <Timeline milestones={milestones} /> : (
            <div style={{ padding: "16px 0", fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
              {t("impact.noMilestones")}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card variant="premium">
          <CardHeader icon={<Lightning size={18} />} title={t("impact.actions")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {([
              { icon: Leaf, labelKey: "impact.action.completeProfile", color: colors.accent, link: "/settings?tab=profil" },
              { icon: Users, labelKey: "impact.action.followFarmers", color: "#1565c0", link: "/farmers" },
              { icon: ShareNetwork, labelKey: "impact.action.inviteContacts", color: "#e65100", link: "/settings?tab=referral" },
              { icon: ShoppingCart, labelKey: "impact.action.browseLots", color: "#2e9b4e", link: "/lots" },
            ] as const).map((a, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(a.link)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: colors.surfaceHover, userSelect: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.borderLight}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.surfaceHover}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${a.color}18`, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <a.icon size={14} color={a.color} />
                </div>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: colors.text }}>
                  {t(a.labelKey)}
                </div>
                <ArrowRight size={12} color={colors.textMuted} />
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Impact Card Preview */}
      {allSnapshots.length > 0 && (
        <Card variant="premium" style={{ marginTop: 24 }}>
          <CardHeader icon={<ShareNetwork size={18} />} title={t("impact.shareCard")} />
          <div style={{
            borderRadius: 14, padding: "24px 20px", textAlign: "center",
            background: colors.surfaceHover, maxWidth: 340, margin: "0 auto",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: `conic-gradient(${tierInfo.color} ${snapshot.overall}%, ${colors.borderLight} ${snapshot.overall}%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: colors.surface, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: colors.text,
              }}>
                {snapshot.overall}
              </div>
            </div>
            <div style={{
              display: "inline-flex", padding: "2px 10px", borderRadius: 4,
              fontSize: 11, fontWeight: 700, background: `${tierInfo.color}18`, color: tierInfo.color,
              marginBottom: 6,
            }}>
              {t(tierInfo.labelKey)}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              {t("impact.cardSubtitle")}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2e9b4e" }}>{snapshot.environmental}</div>
                <div style={{ fontSize: 9, color: colors.textMuted }}>E</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1565c0" }}>{snapshot.social}</div>
                <div style={{ fontSize: 9, color: colors.textMuted }}>S</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e65100" }}>{snapshot.governance}</div>
                <div style={{ fontSize: 9, color: colors.textMuted }}>G</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{snapshot.badgesUnlocked}</div>
                <div style={{ fontSize: 9, color: colors.textMuted }}>{t("impact.cardBadges")}</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
