import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { fadeUp, TRUST_BADGES } from "./data";
import SectionTitle from "./SectionTitle";

interface TrustBadgesSectionProps {
  onRegister: () => void;
}

export default function TrustBadgesSection({ onRegister }: TrustBadgesSectionProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <section style={{ padding: "60px 24px 80px" }}>
      <SectionTitle
        label={t("landing.trustLabel")}
        title={t("landing.trustTitle")}
        desc={t("landing.trustDesc")}
      />
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp} style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          padding: "clamp(28px, 4vw, 48px) clamp(20px, 3vw, 40px)", borderRadius: 16,
          background: alphaColor(isDark, 0.03), border: `1px solid ${alphaColor(isDark, 0.06)}`,
          textAlign: "center",
        }}>
          <div style={{
            display: "flex", justifyContent: "center", gap: "clamp(16px, 3vw, 32px)",
            marginBottom: 28, flexWrap: "wrap",
          }}>
            {TRUST_BADGES.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} whileHover={{ y: -2 }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `${item.color}15`, display: "flex",
                    alignItems: "center", justifyContent: "center", color: item.color,
                  }}><Icon size={17} weight="fill" /></div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: alphaColor(isDark, 0.7) }}>
                    {t(item.labelKey)}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={onRegister}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: colors.accentGradient, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 20px ${colors.accent}44`,
              fontFamily: "inherit",
            }}>
            {t("landing.ctaStart")}
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
