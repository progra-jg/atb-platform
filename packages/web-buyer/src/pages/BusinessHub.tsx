import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FileText, ShieldCheck, Envelope, ArrowRight, ClipboardText } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fadeUp } from "../utils/animations";

export default function BusinessHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const hubs = [
    { key: "deals", icon: FileText, path: "/orders", color: colors.accent, desc: "Suivez vos commandes, contrats, négociations et escrow" },
    { key: "compliance", icon: ShieldCheck, path: "/certificates", color: colors.warning, desc: "Gérez vos certificats, qualité, conformité EUDR et échantillons" },
    { key: "inbox", icon: Envelope, path: "/inbox", color: colors.info, desc: "Consultez vos messages avec les producteurs" },
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
            <ClipboardText size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
              {t("nav.myBusiness")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("dashboard.hubBusinessDesc")}
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
