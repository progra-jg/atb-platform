import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getReferralV2Data } from "../services/referralV2";
import type { ReferralEarning } from "../types/referralV2";
import {
  ShareNetwork, CurrencyCircleDollar, Users, Mouse, ArrowRight, Coins,
} from "@phosphor-icons/react";

export default function ReferralEarningsWidget() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    totalShares: number; totalClicks: number; totalRegistrations: number;
    totalReferredTrades: number; commissionTotal: number;
    clickRate: number; conversionRate: number;
  } | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<ReferralEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const svc = await import("../services/referralV2");
      const s = await svc.getReferralV2Stats(user.id);
      const data = await svc.getReferralV2Data(user.id);
      if (!mounted) return;
      setStats(s);
      setRecentEarnings(data?.earnings?.slice(-5).reverse() ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 20, width: "40%", background: colors.surfaceHover, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ height: 60, background: colors.surfaceHover, borderRadius: 10 }} />
      </div>
    );
  }

  if (!stats || stats.totalShares === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: colors.surface, borderRadius: 16, padding: 20,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ShareNetwork size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("referral.v2.widgetTitle")}
          </span>
        </div>
        <div style={{
          padding: "20px 16px", borderRadius: 12, textAlign: "center",
          background: colors.surfaceHover, border: `1px dashed ${colors.borderLight}`,
        }}>
          <Coins size={28} color={colors.textMuted} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, lineHeight: 1.4 }}>
            {t("referral.v2.noActivity")}
          </p>
          <p style={{ fontSize: 11, color: colors.textMuted, margin: "6px 0 0", lineHeight: 1.3 }}>
            {t("referral.v2.noActivityDesc")}
          </p>
        </div>
      </motion.div>
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
          <ShareNetwork size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("referral.v2.widgetTitle")}
          </span>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 10,
          background: "linear-gradient(135deg, #05966915, #25D36615)",
          color: "#059669", fontSize: 11, fontWeight: 700,
        }}>
          {stats.commissionTotal.toLocaleString("fr-FR")} FCFA
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
        marginBottom: 16,
      }}>
        {[
          { icon: <ShareNetwork size={14} />, label: t("referral.v2.shares"), value: stats.totalShares },
          { icon: <Mouse size={14} />, label: t("referral.v2.clicks"), value: `${stats.clickRate}%` },
          { icon: <Users size={14} />, label: t("referral.v2.registrations"), value: stats.totalRegistrations },
          { icon: <CurrencyCircleDollar size={14} />, label: t("referral.v2.commission"), value: `${stats.commissionTotal.toLocaleString("fr-FR")} FCFA` },
        ].map((item, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "10px 4px", borderRadius: 10,
            background: colors.surfaceHover,
          }}>
            <div style={{ color: colors.textMuted, marginBottom: 4, display: "flex", justifyContent: "center" }}>
              {item.icon}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
              {typeof item.value === "number" ? item.value.toLocaleString("fr-FR") : item.value}
            </div>
            <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {recentEarnings.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: colors.textMuted,
            textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8,
          }}>
            {t("referral.v2.recentEarnings")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentEarnings.map((e, i) => (
              <motion.div
                key={e.tradeId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: 8,
                  background: colors.surfaceHover,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: `${colors.accent}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, flexShrink: 0,
                  }}>
                    {e.crop.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: colors.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {e.referredName}
                    </div>
                    <div style={{ fontSize: 9, color: colors.textMuted }}>
                      {e.tradeAmount.toLocaleString("fr-FR")} FCFA · {e.crop}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: e.status === "credited" ? "#22c55e" : e.status === "cancelled" ? "#ef4444" : "#f59e0b",
                }}>
                  +{e.commissionAmount.toLocaleString("fr-FR")}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11,
        }}>
          <span style={{ color: colors.textMuted }}>
            {t("referral.v2.conversionRate")}: <strong style={{ color: colors.text }}>{stats.conversionRate}%</strong>
          </span>
          <motion.button
            whileHover={{ gap: 10 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", color: colors.accent,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              padding: 0,
            }}
            onClick={() => window.open(`/referral`, "_blank")}
          >
            {t("referral.v2.viewDetails")}
            <ArrowRight size={12} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
