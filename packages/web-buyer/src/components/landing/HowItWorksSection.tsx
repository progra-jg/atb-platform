import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { STEPS, fadeUp } from "./data";
import SectionTitle from "./SectionTitle";

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <section id="how" style={{ padding: "60px 24px 80px" }}>
      <SectionTitle
        label={t("landing.howLabel")}
        title={t("landing.howTitle")}
        desc={t("landing.howDesc")}
      />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: "-40px" }} variants={fadeUp}
                style={{ textAlign: "center", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 28, left: "60%", width: "40%", height: 2,
                    background: `linear-gradient(90deg, ${colors.accent}40, transparent)`,
                  }} />
                )}
                <motion.div whileHover={{ scale: 1.06, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: colors.accentGradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px", color: "#fff",
                    position: "relative",
                    boxShadow: `0 4px 16px ${colors.accent}44`,
                  }}>
                  <Icon size={24} weight="fill" />
                  <div style={{
                    position: "absolute", top: -6, right: -6,
                    width: 22, height: 22, borderRadius: "50%",
                    background: colors.gold, color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 2px 8px ${colors.gold}55`,
                  }}>{String(i + 1).padStart(2, "0")}</div>
                </motion.div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: colors.text }}>{t(s.titleKey)}</h3>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.65 }}>{t(s.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
