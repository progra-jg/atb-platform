import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users, Gift, CopySimple, ArrowRight, ShareNetwork, WhatsappLogo,
  EnvelopeSimple, Check, Sparkle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getReferralData, initializeReferral, getReferralStats } from "../services/referral";
import type { ReferralData, ReferralStats } from "../types/referral";
import Button from "./ui/Button";

interface Props {
  onViewAll?: () => void;
}

export default function ReferralWidget({ onViewAll }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const refData = await getReferralData(user.id);
      if (cancelled) return;
      if (refData) {
        setData(refData);
      } else {
        const initialized = await initializeReferral(user.id);
        if (!cancelled) setData(initialized);
      }
      const refStats = await getReferralStats(user.id);
      if (!cancelled) setStats(refStats);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleCopyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 14, padding: 20,
        border: `1.5px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 18, width: "50%", background: colors.statBg, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ height: 40, background: colors.statBg, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 14, width: "70%", background: colors.statBg, borderRadius: 4 }} />
      </div>
    );
  }

  if (!data) return null;

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      t("referral.share.body", { code: data.code, url: data.shareUrl })
        .replace(/\n/g, "%0A"),
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(t("referral.share.subject"));
    const body = encodeURIComponent(
      t("referral.share.body", { code: data.code, url: data.shareUrl }),
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: `linear-gradient(135deg, ${colors.surface}, ${colors.accent}06)`,
        borderRadius: 14, padding: 20,
        border: `1.5px solid ${colors.accent}20`,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: 120, height: 120,
        borderRadius: "0 0 0 120px",
        background: `radial-gradient(circle at 100% 0%, ${colors.accent}12, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={16} weight="fill" color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
              {t("referral.widget.title")}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 1 }}>
              {t("referral.widget.desc")}
            </div>
          </div>
        </div>
        {copied && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: colors.success,
              background: `${colors.success}15`, padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            <Check size={12} weight="bold" />
            {t("referral.codeCopied")}
          </motion.div>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        padding: "10px 14px",
        background: colors.statBg, borderRadius: 10,
        border: `1px solid ${colors.borderLight}`,
        fontFamily: "var(--font-mono, monospace)", fontSize: 15,
        fontWeight: 700, color: colors.accent, letterSpacing: "1px",
      }}>
        <span style={{ flex: 1 }}>{data.code}</span>
        <motion.button
          onClick={handleCopyCode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 8, border: "none",
            background: `${colors.accent}15`, color: colors.accent,
            cursor: "pointer", fontSize: 11, fontWeight: 600,
          }}
        >
          <CopySimple size={14} />
          {copied ? t("common.done") : t("referral.code")}
        </motion.button>
      </div>

      {stats && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
          marginBottom: 14,
        }}>
          {[
            { icon: Users, label: t("referral.stats.invited"), value: stats.inviteCount, color: colors.accent },
            { icon: Gift, label: t("referral.stats.rewards"), value: `${stats.rewardCount}`, color: colors.gold || "#d97706" },
            { icon: Sparkle, label: t("referral.stats.conversion"), value: `${stats.conversionRate}%`, color: colors.info || "#2563eb" },
          ].map((item, idx) => (
            <div key={idx} style={{
              background: colors.statBg, borderRadius: 8, padding: "8px 10px",
              textAlign: "center",
            }}>
              <item.icon size={14} color={item.color} style={{ marginBottom: 2 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{item.value}</div>
              <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" onClick={shareViaWhatsApp}>
          <WhatsappLogo size={14} weight="fill" />
          {t("referral.share.whatsapp")}
        </Button>
        <Button variant="secondary" size="sm" onClick={shareViaEmail}>
          <EnvelopeSimple size={14} />
          {t("referral.share.email")}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleCopyLink}>
          <ShareNetwork size={14} />
          {copied ? t("referral.share.linkCopied") : t("referral.share.copyLink")}
        </Button>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} style={{ marginLeft: "auto" }}>
            {t("referral.widget.cta")}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
