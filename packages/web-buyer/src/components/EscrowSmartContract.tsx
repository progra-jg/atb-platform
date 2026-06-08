import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { EscrowSmartContractData } from "../types/escrowEngine";
import { Check, Clock, ShieldCheck } from "@phosphor-icons/react";

interface EscrowSmartContractProps {
  data: EscrowSmartContractData;
}

export default function EscrowSmartContract({ data }: EscrowSmartContractProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${colors.borderLight}`,
      background: colors.surface,
    }}>
      <div style={{
        padding: "14px 16px",
        background: `linear-gradient(135deg, ${colors.accent}08, transparent)`,
        borderBottom: `1px solid ${colors.borderLight}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${colors.accent}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={16} color={colors.accent} weight="fill" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
            {t("escrowEngine.contractTitle")}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>
            {data.orderId} · {data.network}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            {data.buyerName} <span style={{ color: colors.textMuted }}>→</span> {data.sellerName}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
            {data.amount.toLocaleString("fr-FR")} {data.currency}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.clauses.map((clause, i) => (
            <motion.div
              key={clause.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", borderRadius: 8,
                background: clause.satisfied ? "rgba(34,197,94,0.06)" : colors.surfaceHover,
                border: `1px solid ${clause.satisfied ? "rgba(34,197,94,0.15)" : "transparent"}`,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: clause.satisfied ? "rgba(34,197,94,0.12)" : `${colors.borderLight}`,
                fontSize: 10, flexShrink: 0,
              }}>
                {clause.satisfied ? <Check size={11} color="#22c55e" weight="bold" /> : <Clock size={11} color={colors.textMuted} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: colors.text,
                  lineHeight: 1.3,
                }}>
                  {t(clause.titleKey)}
                </div>
                <div style={{
                  fontSize: 9, color: colors.textMuted, lineHeight: 1.3,
                }}>
                  {t(clause.descKey)}
                </div>
              </div>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{clause.icon}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
