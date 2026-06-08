import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { getCropEmoji, formatTrend } from "../types/referralV2";

interface SharePricePreviewProps {
  crop: string;
  price: number;
  change: number;
  history?: number[];
  referredBy?: string;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function SharePricePreview({
  crop, price, change, history, referredBy,
}: SharePricePreviewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const emoji = getCropEmoji(crop);
  const trend = formatTrend(change);
  const cropDisplay = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  const isUp = change >= 0;

  const sparkColor = isUp ? "#22c55e" : "#ef4444";

  const tier = useMemo(() => {
    if (change >= 5) return { label: t("market.trendStrong"), color: "#22c55e" };
    if (change >= 2) return { label: t("market.trendUp"), color: "#16a34a" };
    if (change >= 0) return { label: t("market.trendStable"), color: "#6b7280" };
    if (change > -3) return { label: t("market.trendDown"), color: "#f59e0b" };
    return { label: t("market.trendStrongDown"), color: "#ef4444" };
  }, [change, t]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], when: "beforeChildren", staggerChildren: 0.08 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        width: "100%", maxWidth: 380, borderRadius: 20,
        overflow: "hidden",
        background: colors.surface,
        border: `1px solid ${colors.borderLight}`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{
        padding: "20px 20px 16px",
        background: `linear-gradient(135deg, ${isUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"} 0%, transparent 100%)`,
      }}>
        <motion.div variants={itemVariants} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>
                {t(`products.${crop.toLowerCase()}`, { defaultValue: cropDisplay })}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                {t("share.pricePerKg")}
              </div>
            </div>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: 12,
            background: `${tier.color}18`,
            color: tier.color, fontSize: 11, fontWeight: 600,
          }}>
            {tier.label}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} style={{
          display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4,
        }}>
          <span style={{
            fontSize: 32, fontWeight: 800, color: colors.text,
            letterSpacing: "-0.02em",
          }}>
            {price.toLocaleString("fr-FR")}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>FCFA</span>
          <span style={{
            fontSize: 14, fontWeight: 700, marginLeft: 4,
            color: isUp ? "#22c55e" : "#ef4444",
          }}>
            {trend}
          </span>
        </motion.div>
      </div>

      {history && history.length >= 2 && (
        <motion.div variants={itemVariants} style={{
          padding: "0 20px 16px",
          display: "flex", justifyContent: "center",
        }}>
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: colors.surfaceHover,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 6, fontWeight: 500 }}>
              {t("share.priceHistory")}
            </div>
            <MiniSparkline data={history} color={sparkColor} />
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} style={{
        padding: "14px 20px",
        background: colors.surfaceHover,
        borderTop: `1px solid ${colors.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#2d6a4f"/>
          <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
          {t("share.platformLabel")}
        </span>
        {referredBy && (
          <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: "auto" }}>
            {t("share.invitedBy")} {referredBy}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
