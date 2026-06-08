import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  getReferralData,
  getReferralStats,
  regenerateReferralCode,
  initializeReferral,
} from "../services/referral";
import type { ReferralData, ReferralStats, ReferralReward, ReferralInvitee } from "../types/referral";
import {
  Gift, Copy, Check, Users, CurrencyCircleDollar, TrendUp,
  ArrowsClockwise, Warning, ShareNetwork,
} from "@phosphor-icons/react";
import { formatNumber, formatDate } from "../utils/format";

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: "0 0 4px" };
const sectionDesc: React.CSSProperties = { fontSize: 12, color: "", margin: "0 0 20px" };

export default function ReferralSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadReferral();
  }, [user?.id]);

  const loadReferral = async () => {
    setLoading(true);
    let refData = await getReferralData(user!.id);
    if (!refData) {
      refData = await initializeReferral(user!.id);
    }
    setData(refData);
    const s = await getReferralStats(user!.id);
    setStats(s);
    setLoading(false);
  };

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    if (type === "code") { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
    else { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
  };

  const handleRegenerate = async () => {
    if (!user?.id || regenerating) return;
    setRegenerating(true);
    const newCode = await regenerateReferralCode(user.id);
    setData((prev) => prev ? { ...prev, code: newCode, shareUrl: `${window.location.origin}/register?ref=${newCode}` } : prev);
    setRegenerating(false);
    setShowRegenConfirm(false);
    setToast(t("referral.codeRegenerated"));
    setTimeout(() => setToast(null), 2500);
  };

  sectionDesc.color = colors.textMuted;

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 80, borderRadius: 12,
              background: colors.skeleton ?? colors.surface,
              animation: "shimmer 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
        <div style={{ height: 200, borderRadius: 12, background: colors.skeleton ?? colors.surface, animation: "shimmer 1.5s ease-in-out infinite" }} />
      </div>
    );
  }

  if (!data) return null;

  const shareText = t("referral.share.body", { code: data.code, url: data.shareUrl });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ ...sectionTitle, color: colors.text }}>{t("referral.pageTitle")}</h2>
        <p style={sectionDesc}>{t("referral.subtitle")}</p>
      </div>

      {/* Code Section */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.accent}08, ${colors.accent}02)`,
        borderRadius: 14, border: `1.5px solid ${colors.accent}20`,
        padding: 24, marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={14} color={colors.accent} /> {t("referral.yourCode")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <code style={{
            fontSize: 20, fontWeight: 700, letterSpacing: "0.2em",
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
            color: colors.accent, padding: "6px 16px", borderRadius: 8,
            background: colors.surface, border: `1.5px solid ${colors.accent}30`,
          }}>
            {data.code}
          </code>
          <button onClick={() => copyToClipboard(data.code, "code")} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: copiedCode ? colors.successLight : colors.surface,
            color: copiedCode ? colors.success : colors.text,
            border: `1.5px solid ${copiedCode ? colors.success : colors.borderLight}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {copiedCode ? <><Check size={14} /> {t("referral.codeCopied")}</> : <><Copy size={14} /> {t("common.copy")}</>}
          </button>
          <button onClick={() => copyToClipboard(data.shareUrl, "link")} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: copiedLink ? colors.successLight : colors.surface,
            color: copiedLink ? colors.success : colors.text,
            border: `1.5px solid ${copiedLink ? colors.success : colors.borderLight}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {copiedLink ? <><Check size={14} /> {t("referral.share.linkCopied")}</> : <><ShareNetwork size={14} /> {t("referral.share.copyLink")}</>}
          </button>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: `${"#25D366"}10`, color: "#25D366",
              border: `1.5px solid ${"#25D366"}30`,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
            {t("referral.share.whatsapp")}
          </button>
          <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(t("referral.share.subject"))}&body=${encodeURIComponent(shareText)}`, "_blank")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: `${"#2563eb"}10`, color: "#2563eb",
              border: `1.5px solid ${"#2563eb"}30`,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
            {t("referral.share.email")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: Users, label: t("referral.stats.invited"), value: stats?.inviteCount ?? 0, color: "#2563eb" },
          { icon: CurrencyCircleDollar, label: t("referral.stats.rewardAmount"), value: `${formatNumber(stats?.rewardAmount ?? 0)} XOF`, color: "#059669" },
          { icon: TrendUp, label: t("referral.stats.conversion"), value: `${stats?.conversionRate ?? 0}%`, color: "#d97706" },
        ].map((card, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 12,
            background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <card.icon size={14} color={card.color} />
              <span style={{ fontSize: 10, color: colors.textMuted }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Rewards Timeline */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: "0 0 12px" }}>{t("referral.timeline")}</h3>
        {data.rewards.length === 0 ? (
          <p style={{ fontSize: 13, color: colors.textMuted, padding: "8px 0" }}>{t("referral.noRewards")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.rewards.slice().reverse().map((r: ReferralReward) => (
              <div key={r.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{t(r.labelKey)}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{formatDate(r.createdAt)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.accent }}>+{formatNumber(r.amount)} XOF</div>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                    background: r.status === "credited" ? colors.successLight : r.status === "pending" ? colors.warningLight : colors.errorLight,
                    color: r.status === "credited" ? colors.success : r.status === "pending" ? colors.warning : colors.error,
                  }}>
                    {t(`referral.reward.${r.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invitees */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: "0 0 12px" }}>{t("referral.invitees.title")}</h3>
        {data.invitees.length === 0 ? (
          <p style={{ fontSize: 13, color: colors.textMuted, padding: "8px 0" }}>{t("referral.invitees.empty")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.invitees.map((inv: ReferralInvitee) => (
              <div key={inv.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: colors.accentLight, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: colors.accent,
                  }}>
                    {inv.company.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{inv.company}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{formatDate(inv.joinedAt)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>+{inv.rewardsEarned} XOF</span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                    background: inv.status === "active" ? colors.successLight : colors.warningLight,
                    color: inv.status === "active" ? colors.success : colors.warning,
                  }}>
                    {inv.status === "active" ? t("referral.invitees.active") : t("referral.invitees.pending")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regenerate */}
      <div style={{
        padding: 16, borderRadius: 12,
        background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
      }}>
        {!showRegenConfirm ? (
          <button onClick={() => setShowRegenConfirm(true)} disabled={regenerating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: "transparent", color: colors.warning,
              border: `1.5px solid ${colors.warning}40`,
              cursor: regenerating ? "not-allowed" : "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
            <ArrowsClockwise size={14} className={regenerating ? "spin" : ""} />
            {t("referral.regenerate")}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Warning size={16} color={colors.warning} />
            <span style={{ fontSize: 12, color: colors.text }}>{t("referral.regenerateConfirm")}</span>
            <button onClick={handleRegenerate} disabled={regenerating}
              style={{
                padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: colors.warning, color: "#fff", border: "none",
                cursor: regenerating ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>
              {regenerating ? t("common.loading") : t("common.confirm")}
            </button>
            <button onClick={() => setShowRegenConfirm(false)}
              style={{
                padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "transparent", color: colors.textMuted, border: `1.5px solid ${colors.borderLight}`,
                cursor: "pointer", fontFamily: "inherit",
              }}>
              {t("common.cancel")}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
          color: "white", padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          zIndex: 9999, animation: "fadeSlideUp 0.3s ease",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}


