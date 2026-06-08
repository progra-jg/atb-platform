import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { EscrowSavings } from "../types/escrowEngine";
import { CurrencyCircleDollar, Gift } from "@phosphor-icons/react";

interface EscrowFeeBadgeProps {
  savings: EscrowSavings;
  amount: number;
}

export default function EscrowFeeBadge({ savings, amount }: EscrowFeeBadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 14,
        border: `1px solid ${savings.tierColor}22`,
        background: `${savings.tierColor}08`,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {savings.isFree ? (
              <Gift size={16} color={savings.tierColor} weight="fill" />
            ) : (
              <CurrencyCircleDollar size={16} color={savings.tierColor} />
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>
              {t("escrowEngine.feeLabel")}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: savings.tierColor,
            padding: "2px 8px", borderRadius: 6,
            background: `${savings.tierColor}12`,
          }}>
            {t(savings.tierLabelKey)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
              {t("escrowEngine.fee.standard")}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: colors.textMuted,
              textDecoration: savings.savings > 0 ? "line-through" : "none",
              opacity: savings.savings > 0 ? 0.5 : 1,
            }}>
              {savings.standardFee.toLocaleString("fr-FR")} FCFA
            </div>
          </div>

          {savings.savings > 0 && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                {t("escrowEngine.fee.yourFee")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: savings.tierColor }}>
                {savings.actualFee.toLocaleString("fr-FR")} FCFA
              </div>
            </div>
          )}
        </div>

        {savings.savings > 0 && (
          <div style={{
            marginTop: 8, paddingTop: 8,
            borderTop: `1px solid ${savings.tierColor}18`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>
              {t("escrowEngine.fee.savings")}
            </span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: savings.tierColor,
            }}>
              +{savings.savings.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        )}

        {savings.isFree && (
          <div style={{
            marginTop: 8, textAlign: "center",
            fontSize: 11, fontWeight: 600, color: savings.tierColor,
          }}>
            {t("escrowEngine.feeFree")}
          </div>
        )}
      </div>
    </motion.div>
  );
}
