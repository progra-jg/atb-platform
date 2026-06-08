import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, User, ArrowRight, Package } from "@phosphor-icons/react";
import Card, { CardHeader } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";
import { useFollowedFarmers, useFollowedFeed } from "../hooks/useFollowedFarmers";
import { formatNumber } from "../utils/format";
import type { ProducerFeedItem } from "../types/follow";

export default function FollowedFarmersPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { followedProfiles, isLoading: profilesLoading } = useFollowedFarmers();
  const { feed, isLoading: feedLoading } = useFollowedFeed();

  if (profilesLoading || feedLoading) {
    return (
      <Card variant="premium" style={{ padding: 20 }}>
        <CardHeader icon={<Users size={16} />} title={t("follow.title")} />
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, fontSize: 13 }}>
          {t("common.loading")}
        </div>
      </Card>
    );
  }

  if (followedProfiles.length === 0) {
    return (
      <Card variant="premium" style={{ padding: 20 }}>
        <CardHeader icon={<Users size={16} />} title={t("follow.title")} />
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${colors.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: colors.accent }}>
            <UserPlus size={22} />
          </div>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
            {t("follow.empty")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/farmers")}
          style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${colors.borderLight}`, background: colors.surface, cursor: "pointer", color: colors.accent, fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s" }}
        >
          {t("follow.discoverProducers")}
        </motion.button>
      </Card>
    );
  }

  return (
    <Card variant="premium" style={{ padding: 20 }}>
      <CardHeader
        icon={<Users size={16} />}
        title={t("follow.title")}
        action={
          <button onClick={() => navigate("/farmers")} style={{ background: "none", border: "none", cursor: "pointer", color: colors.accent, fontSize: 11, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}>
            {t("common.viewAll")} <ArrowRight size={12} />
          </button>
        }
      />

      {/* Followed Producers row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: feed.length > 0 ? 14 : 0 }}>
        {followedProfiles.slice(0, 6).map((f) => (
          <motion.button
            key={f.anonymousId}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/farmers/${f.anonymousId}`)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.surface, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${colors.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.accent, fontSize: 10, fontWeight: 700 }}>
              {f.displayName?.split(" ").map((n) => n[0]).join("") || "?"}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{f.displayName}</span>
          </motion.button>
        ))}
        {followedProfiles.length > 6 && (
          <div style={{ fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center" }}>
            +{followedProfiles.length - 6}
          </div>
        )}
      </div>

      {/* Feed from followed farmers */}
      {feed.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: colors.textMuted, marginBottom: 8 }}>
            {t("follow.recentLots")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {feed.slice(0, 5).map((item) => (
              <FeedRow key={item.lotId} item={item} colors={colors} onNavigate={navigate} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FeedRow({ item, colors, onNavigate }: { item: ProducerFeedItem; colors: any; onNavigate: (path: string) => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={() => onNavigate(`/lots/${item.lotId}`)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: colors.surface, border: `1px solid ${colors.borderLight}`, cursor: "pointer", transition: "all 0.15s" }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${colors.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.accent }}>
        <Package size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{item.crop}</div>
        <div style={{ fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
          <User size={9} /> {item.farmerName} · {item.quantity}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent }}>{formatNumber(item.price)}</div>
        <div style={{ fontSize: 9, color: colors.textMuted }}>{t("common.currency")}/kg</div>
      </div>
    </motion.div>
  );
}

function UserPlus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="88" cy="108" r="44" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 220c0-44 28.6-64 64-64s64 20 64 64" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="180" y1="88" x2="212" y2="88" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="196" y1="72" x2="196" y2="104" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
