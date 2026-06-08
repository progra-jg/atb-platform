import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { FEATURES, scaleIn } from "./data";
import SectionTitle from "./SectionTitle";

export default function FeaturesSection() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <section id="features" style={{ padding: "60px 24px 80px" }}>
      <SectionTitle
        label={t("landing.featuresLabel")}
        title={t("landing.featuresTitle")}
        desc={t("landing.featuresDesc")}
      />
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: "-40px" }} variants={scaleIn}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                }}
                style={{
                  padding: "28px 24px", borderRadius: 14,
                  background: colors.surface, border: `1px solid ${alphaColor(isDark, 0.06)}`,
                  cursor: "default", position: "relative", overflow: "hidden",
                  boxShadow: colors.shadowXs,
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${colors.accentGradient} padding-box, linear-gradient(135deg, ${colors.accent}44, ${colors.gold}22) border-box`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, color: "#fff",
                  boxShadow: `0 2px 12px ${colors.accent}33`,
                }}><Icon size={20} weight="fill" /></div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: colors.text }}>{t(f.titleKey)}</h3>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.65 }}>{t(f.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
