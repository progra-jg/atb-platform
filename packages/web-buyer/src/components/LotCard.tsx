import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Star, MapPin, User, Package, ArrowsLeftRight,
  ShoppingCart, CheckCircle, Image as ImageIcon, SealCheck,
} from "@phosphor-icons/react";
import type { LotScores } from "../utils/ranking";
import Badge from "./Badge";
import Button from "./ui/Button";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";
import { computeLotCompleteness } from "../utils/scoring";
import CompletenessGauge from "./CompletenessGauge";
import ThresholdBadge from "./ThresholdBadge";
import { computeThreshold } from "../utils/threshold";
import type { Lot } from "../types";

interface LotCardProps {
  lot: Lot;
  fav: boolean;
  isInCompare: boolean;
  index: number;
  cartFeedback: string | null;
  onToggleFav: (e: React.MouseEvent) => void;
  onToggleCompare: () => void;
  onAddToCart: () => void;
  rankWeight?: number;
  rankScores?: LotScores;
  dominantReason?: string;
}

export default function LotCard({
  lot, fav, isInCompare, index, cartFeedback,
  onToggleFav, onToggleCompare, onAddToCart,
  rankWeight, rankScores, dominantReason,
}: LotCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => navigate(`/lots/${lot.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      aria-label={`${tCrop(lot.culture)} — ${formatNumber(lot.prix)} FCFA/kg`}
      onKeyDown={(e) => { if (e.key === "Enter") navigate(`/lots/${lot.id}`); }}
      style={{
        background: colors.surface, borderRadius: 12,
        border: `1px solid ${colors.borderLight}`,
        cursor: "pointer", overflow: "hidden",
        transition: "box-shadow 0.25s, transform 0.25s",
        boxShadow: hover ? colors.shadowMd : colors.shadowXs,
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        animation: `fadeSlideUp 0.35s ease ${0.04 * index}s both`,
      }}
    >
      <div style={{ padding: "14px 16px" }}>
        {/* Top row: ID + status + actions */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
            color: colors.textSecondary, letterSpacing: "0.4px",
          }}>
            {lot.id}
          </span>
          <Badge text={t("lotStatus." + lot.statut, lot.statut)} variant={
            lot.statut === "Disponible" ? "success" : lot.statut === "En transit" ? "warning" : "error"
          } size="sm" pill />
          <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
              aria-label={isInCompare ? t("common.removeFromFavorites") : t("common.compare")}
              style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "transparent", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
                color: isInCompare ? colors.accent : colors.textMuted,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <ArrowsLeftRight size={12} weight={isInCompare ? "fill" : "regular"} />
            </button>
            <button
              onClick={onToggleFav}
              aria-label={fav ? t("common.removeFromFavorites") : t("common.addToFavorites")}
              style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "transparent", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
                color: fav ? colors.gold : colors.textMuted,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Star size={12} weight={fav ? "fill" : "regular"} />
            </button>
          </div>
        </div>

        {/* Crop name + ranking badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 600, color: colors.text,
            letterSpacing: "-0.01em",
          }}>
            {tCrop(lot.culture)}
          </span>
          {dominantReason && rankWeight !== undefined && (
            <span title={`${t("lots.ranking.reason")} ${t(dominantReason)} — ${t("lots.ranking.score")} ${Math.round(rankWeight * 100)}`}
              style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.2px",
                padding: "2px 6px", borderRadius: 4,
                color: rankScores?.relevance === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#3b82f6"
                  : rankScores?.trust === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#22c55e"
                  : rankScores?.quality === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#f59e0b"
                  : "#a855f7",
                background: rankScores?.relevance === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#3b82f618"
                  : rankScores?.trust === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#22c55e18"
                  : rankScores?.quality === Math.max(rankScores?.relevance ?? 0, rankScores?.trust ?? 0, rankScores?.quality ?? 0, rankScores?.rotation ?? 0) ? "#f59e0b18"
                  : "#a855f718",
                whiteSpace: "nowrap",
              }}
            >
              {t(dominantReason)}
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 3,
          marginBottom: 10, paddingBottom: 10,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: colors.accent, letterSpacing: "-0.3px" }}>
            {formatNumber(lot.prix)}
          </span>
          <span style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>
            {t("common.currency")}/kg
          </span>
          {(() => {
            const inferredTrust = Math.round(
              (lot.note ?? 50) * 0.4 +
              (lot.certification ? 30 : 0) +
              (lot.statut === "Disponible" ? 15 : 0) +
              (lot.phone ? 15 : 0)
            );
            const trustColor = inferredTrust >= 85 ? colors.success : inferredTrust >= 65 ? colors.warning : colors.error;
            return (
              <span style={{
                marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 9, fontWeight: 600, letterSpacing: "0.3px",
                color: trustColor, background: `${trustColor}18`,
                padding: "1px 7px", borderRadius: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: trustColor }} />
                {inferredTrust}
              </span>
            );
          })()}
        </div>

        {/* Info grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 10,
        }}>
          <InfoItem icon={Package} label={t("lots.fields.volume")} value={lot.quantite} colors={colors} />
          <InfoItem icon={MapPin} label={t("lots.fields.origin")} value={lot.origine} colors={colors} />
          <InfoItem icon={User} label={t("lots.fields.farmer")} value={lot.producteur} colors={colors} link />
          <InfoItem icon={MapPin} label={t("lots.fields.region")} value={lot.region} colors={colors} />
        </div>

        {/* Media & Harvest indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {lot.images && lot.images.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: colors.textMuted }}>
              <ImageIcon size={11} />
              <span>{lot.images.length}</span>
            </div>
          )}
          {lot.harvest?.qualityGrade && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: colors.success, background: `${colors.success}14`, padding: "1px 6px", borderRadius: 4 }}>
              <span>{lot.harvest.qualityGrade}</span>
            </div>
          )}
          {lot.harvest?.year && (
            <div style={{ fontSize: 10, fontWeight: 500, color: colors.textMuted }}>
              {lot.harvest.year}
            </div>
          )}
          <div style={{ marginLeft: "auto" }}>
            <ThresholdBadge result={computeThreshold(lot)} size="sm" />
          </div>
        </div>

        {/* Certification */}
        {lot.certification && (
          <div style={{ marginBottom: 10 }}>
            <Badge text={lot.certification}
              variant={lot.certification === "EUDR" ? "success" : lot.certification === "GlobalGAP" ? "warning" : lot.certification === "Bio" ? "info" : "neutral"}
              size="sm" pill />
          </div>
        )}

        {/* Data completeness */}
        {(() => { const c = computeLotCompleteness(lot); return c.score < 100 ? (
          <div style={{ marginBottom: 10 }}>
            <CompletenessGauge result={c} size="sm" />
          </div>
        ) : null; })()}

        {/* CTA */}
        {lot.statut === "Disponible" && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="premium" size="sm" fullWidth
              icon={cartFeedback === lot.id ? <CheckCircle size={14} weight="fill" /> : <ShoppingCart size={14} />}
              onClick={onAddToCart}>
              {cartFeedback === lot.id ? t("cart.sent") : t("cart.order")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, colors, link }: {
  icon: React.ElementType; label: string; value: string; colors: ThemeColors; link?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <Icon size={11} color={colors.textMuted} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: colors.textMuted, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, marginLeft: "auto", minWidth: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: colors.text,
        textDecoration: link ? "underline" : "none",
        textUnderlineOffset: 2,
      }}>
        {value}
      </span>
    </div>
  );
}
