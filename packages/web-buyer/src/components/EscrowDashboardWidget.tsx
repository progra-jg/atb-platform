import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getEscrowDashboardSummary } from "../services/escrowEngine";
import type { EscrowDashboardSummary } from "../types/escrowEngine";
import {
  ShieldCheck, ArrowRight, LockKey, CurrencyCircleDollar, Lightning,
} from "@phosphor-icons/react";

interface EscrowDashboardWidgetProps {
  onViewAll?: () => void;
}

export default function EscrowDashboardWidget({ onViewAll }: EscrowDashboardWidgetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [summary, setSummary] = useState<EscrowDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const s = await getEscrowDashboardSummary(user.id);
      if (mounted) { setSummary(s); setLoading(false); }
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ height: 48, background: colors.surfaceHover, borderRadius: 10 }} />
          <div style={{ height: 48, background: colors.surfaceHover, borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  if (!summary || (summary.activeCount === 0 && summary.lifetimeSavings === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: colors.surface, borderRadius: 16, padding: 20,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("escrowEngine.dashboard.title")}
          </span>
        </div>
        <div style={{
          padding: "16px 12px", borderRadius: 10, textAlign: "center",
          background: colors.surfaceHover, border: `1px dashed ${colors.borderLight}`,
        }}>
          <LockKey size={24} color={colors.textMuted} style={{ opacity: 0.3, marginBottom: 6 }} />
          <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.4 }}>
            {t("escrowEngine.dashboard.empty")}
          </p>
          <p style={{ fontSize: 10, color: colors.textMuted, margin: "4px 0 0", lineHeight: 1.3 }}>
            {t("escrowEngine.dashboard.emptyDesc")}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color={colors.accent} weight="fill" />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("escrowEngine.dashboard.title")}
          </span>
        </div>
        {summary.pendingActionCount > 0 && (
          <div style={{
            padding: "2px 8px", borderRadius: 8,
            background: `${colors.warning}18`,
            color: colors.warning, fontSize: 10, fontWeight: 700,
          }}>
            {summary.pendingActionCount} {t("escrowEngine.dashboard.pending")}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        <div style={{
          textAlign: "center", padding: "10px 4px", borderRadius: 10,
          background: colors.surfaceHover,
        }}>
          <ShieldCheck size={16} color={colors.accent} style={{ marginBottom: 2 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
            {summary.activeCount}
          </div>
          <div style={{ fontSize: 9, color: colors.textMuted }}>{t("escrowEngine.dashboard.active")}</div>
        </div>
        <div style={{
          textAlign: "center", padding: "10px 4px", borderRadius: 10,
          background: colors.surfaceHover,
        }}>
          <CurrencyCircleDollar size={16} color={colors.text} style={{ marginBottom: 2 }} />
          <div style={{
            fontSize: 14, fontWeight: 700, color: colors.text, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {summary.totalLocked.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 9, color: colors.textMuted }}>{summary.currency}</div>
        </div>
        <div style={{
          textAlign: "center", padding: "10px 4px", borderRadius: 10,
          background: colors.surfaceHover,
        }}>
          <Lightning size={16} color="#22c55e" style={{ marginBottom: 2 }} />
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#22c55e", lineHeight: 1.2,
          }}>
            +{summary.lifetimeSavings.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 9, color: colors.textMuted }}>{t("escrowEngine.dashboard.savings")}</div>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px", borderRadius: 8,
        background: colors.surfaceHover, fontSize: 10,
      }}>
        <span style={{ color: colors.textMuted }}>
          {t("escrowEngine.dashboard.nextFee")}
        </span>
        <span style={{ fontWeight: 700, color: colors.text }}>
          {summary.nextFeeRate}% · {t(summary.nextFeeTier)}
        </span>
      </div>

      {onViewAll && (
        <div style={{
          marginTop: 10, paddingTop: 8,
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
            {t("escrowEngine.dashboard.viewAll")}
            <ArrowRight size={12} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
