import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { DemandMatch } from "../types/demand";
import { User, Check, X, ArrowRight, SealCheck, MapPin } from "@phosphor-icons/react";

interface DemandMatchCardProps {
  match: DemandMatch;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function DemandMatchCard({ match, onAccept, onReject }: DemandMatchCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const scoreColor = match.overallScore >= 80 ? "#22c55e" : match.overallScore >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 14, borderRadius: 12,
        background: colors.surface, border: `1px solid ${colors.borderLight}`,
        borderLeft: `3px solid ${scoreColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${colors.accent}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.accent,
        }}>
          {match.producerName.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
              {match.producerName}
            </span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>
              · {match.producerCooperative}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textMuted, marginBottom: 6 }}>
            <MapPin size={10} /> {match.producerRegion}
            <span style={{ marginLeft: 4 }}>· {match.proposedVolumeKg.toLocaleString("fr-FR")} kg</span>
            <span>· {match.proposedPriceFcfa.toLocaleString("fr-FR")} FCFA/kg</span>
          </div>

          <div style={{ fontSize: 11, color: colors.text, lineHeight: 1.4, marginBottom: 8 }}>
            {match.message}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "2px 6px", borderRadius: 4,
              background: `${scoreColor}12`, fontSize: 10, fontWeight: 600, color: scoreColor,
            }}>
              {match.overallScore}% {t("demand.match")}
            </div>
            {match.certificationMatch.length > 0 && (
              <div style={{ display: "flex", gap: 2 }}>
                {match.certificationMatch.map((c, i) => (
                  <span key={i} style={{
                    padding: "1px 5px", borderRadius: 3,
                    background: `${colors.success}10`,
                    fontSize: 9, color: colors.success,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {match.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <motion.button
                onClick={() => onAccept?.(match.id)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Check size={12} weight="bold" />
                {t("demand.accept")}
              </motion.button>
              <motion.button
                onClick={() => onReject?.(match.id)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${colors.borderLight}`,
                  background: "transparent", color: colors.textMuted,
                  fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <X size={12} />
                {t("demand.reject")}
              </motion.button>
            </div>
          )}

          {(match.status === "accepted" || match.status === "fulfilled") && (
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: "#22c55e",
            }}>
              <SealCheck size={14} weight="fill" />
              {t("demand.accepted")}
            </div>
          )}

          {match.status === "rejected" && (
            <div style={{
              fontSize: 11, fontWeight: 500, color: colors.textMuted,
            }}>
              {t("demand.rejected")}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
