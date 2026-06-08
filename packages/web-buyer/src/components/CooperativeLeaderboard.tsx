import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { listCooperatives } from "../services/cooperative";
import type { Cooperative } from "../types/cooperative";
import {
  Trophy, Medal, Users, Package, ArrowRight, MapPin,
} from "@phosphor-icons/react";

interface CooperativeLeaderboardProps {
  onViewAll?: () => void;
  limit?: number;
}

const TIER_COLORS = ["#fbbf24", "#9ca3af", "#d97706"];
const TIER_ICONS = [Trophy, Medal, Trophy];

export default function CooperativeLeaderboard({ onViewAll, limit = 10 }: CooperativeLeaderboardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await listCooperatives();
      if (mounted) {
        setCoops(all);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sorted = useMemo(() =>
    [...coops].sort((a, b) => b.totalRevenueXof - a.totalRevenueXof).slice(0, limit),
  [coops, limit]);

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 18, width: "50%", background: colors.surfaceHover, borderRadius: 6, marginBottom: 16 }} />
        {[1,2,3].map((i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.surfaceHover }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, width: "60%", background: colors.surfaceHover, borderRadius: 4, marginBottom: 4 }} />
              <div style={{ height: 10, width: "40%", background: colors.surfaceHover, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Trophy size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("cooperative.leaderboardTitle")}
          </span>
        </div>
        <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", padding: "12px 0" }}>
          {t("cooperative.noCooperatives")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={16} color={colors.accent} weight="fill" />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("cooperative.leaderboardTitle")}
          </span>
        </div>
        <span style={{ fontSize: 10, color: colors.textMuted }}>
          {coops.length} {t("cooperative.total")}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sorted.map((coop, i) => {
          const TierIcon = i < 3 ? TIER_ICONS[i] : null;
          const tierColor = i < 3 ? TIER_COLORS[i] : undefined;

          return (
            <motion.div
              key={coop.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 10,
                background: i < 3 ? `${tierColor}08` : "transparent",
                borderBottom: i < sorted.length - 1 ? `1px solid ${colors.borderLight}` : "none",
              }}
            >
              <div style={{
                width: 26, minWidth: 26, height: 26, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < 3 ? `${tierColor}18` : "transparent",
                fontWeight: 700, fontSize: 11,
                color: i < 3 ? tierColor : colors.textMuted,
              }}>
                {i < 3 && TierIcon ? <TierIcon size={14} weight="fill" /> : i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: colors.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {coop.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textMuted }}>
                  <MapPin size={10} /> {coop.region} · {coop.commune}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                  {coop.totalRevenueXof.toLocaleString("fr-FR")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: colors.textMuted }}>
                  <Users size={9} /> {coop.memberCount}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {onViewAll && (
        <div style={{
          marginTop: 12, paddingTop: 10,
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
            {t("cooperative.viewAll")}
            <ArrowRight size={12} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
