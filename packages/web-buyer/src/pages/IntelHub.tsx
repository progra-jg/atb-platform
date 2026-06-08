import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChartBar, Leaf, Buildings, ArrowRight } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fadeUp } from "../utils/animations";

export default function IntelHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const hubs = [
    { key: "insights", icon: ChartBar, path: "/insights", color: colors.info, desc: "Analyses de marché, tendances et prévisions de prix" },
    { key: "impact", icon: Leaf, path: "/impact", color: colors.accent, desc: "Score ESG, météo et suivi d'impact environnemental" },
    { key: "network", icon: Buildings, path: "/cooperatives", color: colors.warning, desc: "Coopératives, offres de demande et logistique" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: colors.accentGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ChartBar size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
              {t("nav.intelligence")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("dashboard.hubIntelDesc")}
            </p>
          </div>
        </div>
      </motion.div>

      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginTop: 28,
      }}>
        {hubs.map((h) => {
          const Icon = h.icon;
          return (
            <motion.div key={h.key} variants={fadeUp} initial="hidden" animate="visible" onClick={() => navigate(h.path)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: colors.surface, borderRadius: 16, padding: "24px 20px",
                border: `1.5px solid ${colors.borderLight}`, cursor: "pointer",
                boxShadow: colors.shadowXs,
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${h.color}15`, display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <Icon size={22} weight="fill" color={h.color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                {t("nav." + h.key)}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, marginBottom: 14 }}>
                {h.desc}
              </div>
              <div style={{ fontSize: 12, color: h.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                {t("common.viewAll")} <ArrowRight size={12} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
