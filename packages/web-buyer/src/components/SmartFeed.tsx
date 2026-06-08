import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lightning, Star, Leaf, Users, Sparkle, SealCheck, TrendDown,
  MapPin, Heart, ShoppingCart, ArrowRight, CaretRight, Clock,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useRecommendations } from "../hooks/useRecommendations";
import Card, { CardHeader, CardDivider } from "./ui/Card";
import Button from "./ui/Button";
import Skeleton from "./Skeleton";
import { formatNumber, formatCompact } from "../utils/format";
import { tCrop } from "../utils/i18n";
import type { LotMatch, MatchCategory } from "../types/recommendation";

const CATEGORY_META: Record<MatchCategory, { icon: React.ElementType; color: string; bg: string }> = {
  perfect_match: { icon: Sparkle, color: "#7c3aed", bg: "#7c3aed18" },
  esg_booster: { icon: Leaf, color: "#2e9b4e", bg: "#2e9b4e18" },
  best_value: { icon: TrendDown, color: "#1565c0", bg: "#1565c018" },
  from_followed: { icon: Users, color: "#e65100", bg: "#e6510018" },
  new_arrival: { icon: Clock, color: "#6d4c41", bg: "#6d4c4118" },
  certified: { icon: SealCheck, color: "#00897b", bg: "#00897b18" },
  volume_match: { icon: ShoppingCart, color: "#ad1457", bg: "#ad145718" },
  regional: { icon: MapPin, color: "#1565c0", bg: "#1565c018" },
};

function ReasonBadge({ reason }: { reason: LotMatch["reasons"][0] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const meta = CATEGORY_META[reason.category];
  const Icon = meta?.icon ?? Star;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
      background: meta?.bg ?? colors.surfaceHover,
      color: meta?.color ?? colors.textSecondary,
      whiteSpace: "nowrap",
    }}>
      <Icon size={10} />
      {t(reason.labelKey)}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#2e9b4e" : score >= 40 ? "#ffc107" : "#f44336";
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `conic-gradient(${color} ${score}%, transparent ${score}%)`,
      position: "relative",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 800,
      }}>
        {score}
      </div>
    </div>
  );
}

function MatchCard({ match, index }: { match: LotMatch; index: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const meta = CATEGORY_META[match.reasons[0]?.category] ?? CATEGORY_META.perfect_match;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={() => navigate(`/lots/${match.lot.id}`)}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      style={{
        background: colors.surface, borderRadius: 12,
        border: `1px solid ${colors.borderLight}`,
        padding: "12px 14px", cursor: "pointer",
        boxShadow: colors.shadowXs,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <ScoreRing score={match.score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
              {tCrop(match.lot.culture)}
            </span>
            {match.isFollowedProducer && <Users size={10} color={colors.accent} weight="fill" />}
            {match.isFavorited && <Heart size={10} color="#e91e63" weight="fill" />}
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 5 }}>
            {match.lot.producteur} · {match.lot.region} · {match.lot.quantite}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {match.reasons.slice(0, 2).map((r, i) => (
              <ReasonBadge key={i} reason={r} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
            {formatNumber(match.lot.prix)}
          </div>
          <div style={{ fontSize: 9, color: colors.textMuted }}>FCFA/kg</div>
          {match.priceVsMarket === "below" && (
            <div style={{
              fontSize: 9, fontWeight: 600, color: colors.success,
              marginTop: 2,
            }}>
              -{match.score >= 60 ? "15" : "5"}% marché
            </div>
          )}
        </div>
      </div>
      {match.esgImpact > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.borderLight}` }}>
          <Leaf size={10} color={colors.success} />
          <span style={{ fontSize: 9, color: colors.success, fontWeight: 600 }}>
            {t("recommendations.esgImpact", { points: match.esgImpact })}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function SmartFeed() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { feed, picks, loading } = useRecommendations();

  if (loading) {
    return (
      <Card variant="premium">
        <CardHeader icon={<Lightning size={18} />} title={t("recommendations.title")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0" }}>
              <Skeleton width={36} height={36} radius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={14} mb={4} />
                <Skeleton width="40%" height={10} mb={4} />
                <Skeleton width="30%" height={10} />
              </div>
              <Skeleton width={40} height={20} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!feed || feed.lots.length === 0) {
    return (
      <Card variant="premium">
        <CardHeader icon={<Lightning size={18} />} title={t("recommendations.title")} />
        <div style={{
          textAlign: "center", padding: "20px 16px",
          fontSize: 12, color: colors.textSecondary,
        }}>
          <Sparkle size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>{t("recommendations.empty")}</div>
          <div style={{ marginTop: 4 }}>{t("recommendations.emptyDesc")}</div>
          <Button variant="primary" size="sm" onClick={() => navigate("/lots")} style={{ marginTop: 12 }}>
            {t("dashboard.quickActions.viewLots")} →
          </Button>
        </div>
      </Card>
    );
  }

  const topReason = feed.lots[0]?.reasons[0];

  return (
    <Card variant="premium">
      <CardHeader
        icon={<Lightning size={18} />}
        title={t("recommendations.title")}
        subtitle={`${feed.lots.length} ${t("recommendations.matched")}`}
        action={<Button variant="ghost" size="sm" onClick={() => navigate("/lots")}>{t("common.viewAll")} →</Button>}
      />

      {/* Smart Picks — top lots compact */}
      {picks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          }}>
            <Star size={12} color={colors.warning} weight="fill" />
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>
              {t("recommendations.smartPicks")}
            </span>
            {topReason && (
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4,
                background: colors.accentLight, color: colors.accent, fontWeight: 600,
                marginLeft: "auto",
              }}>
                {t(topReason.labelKey)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {picks.map((p, i) => {
              const meta = CATEGORY_META[p.reasons[0]?.category] ?? CATEGORY_META.perfect_match;
              return (
                <motion.div
                  key={p.lot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => navigate(`/lots/${p.lot.id}`)}
                  whileHover={{ y: -3 }}
                  style={{
                    flexShrink: 0, width: 160,
                    background: colors.surface, borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    padding: 10, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: meta.bg, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    marginBottom: 6,
                  }}>
                    <meta.icon size={12} color={meta.color} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                    {tCrop(p.lot.culture)}
                  </div>
                  <div style={{ fontSize: 10, color: colors.textSecondary }}>
                    {formatCompact(p.lot.prix)} FCFA
                  </div>
                  <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
                    {p.lot.region}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <CardDivider />

      {/* Full list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {feed.lots.slice(0, 5).map((match, i) => (
          <MatchCard key={match.lot.id} match={match} index={i} />
        ))}
      </div>

      {feed.lots.length > 5 && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/lots")}>
            {t("recommendations.viewMore", { count: feed.lots.length - 5 })} <CaretRight size={12} />
          </Button>
        </div>
      )}
    </Card>
  );
}
