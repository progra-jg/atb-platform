import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { CheckCircle } from "@phosphor-icons/react";
import { type ThemeColors } from "../../context/ThemeContext";

export default function PricingCards({ colors, navigate: nav }: { colors: ThemeColors; navigate: (path: string) => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const tiers = [
    { key: "Starter", features: 3 },
    { key: "Business", features: 4 },
    { key: "Enterprise", features: 4 },
  ];

  return (
    <section ref={ref} style={{ padding: "5rem 1rem", background: colors.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, textAlign: "center", color: colors.text, marginBottom: "0.75rem" }}
        >
          {t("landing.pricingTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ textAlign: "center", color: colors.textSecondary, marginBottom: "3rem", fontSize: "1.05rem" }}
        >
          {t("landing.pricingDesc")}
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem", alignItems: "start" }}>
          {tiers.map((tier, i) => {
            const popular = tier.key === "Business";
            return (
                <motion.div
                  key={tier.key}
                  initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                  whileHover={inView ? { y: -6, boxShadow: colors.shadowLg, transition: { duration: 0.25 } } : {}}
                  style={{
                    background: colors.bg, borderRadius: 20, padding: "2rem", border: popular ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                    position: "relative", textAlign: "center",
                  }}
                >
                  {popular && (
                    <span style={{ position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)", background: colors.accent, color: "#fff", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 1rem", borderRadius: 20 }}>
                      {t("common.popular")}
                    </span>
                  )}
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: colors.text, marginBottom: "0.5rem" }}>{t(`landing.pricing${tier.key}`)}</h3>
                <p style={{ fontSize: "0.85rem", color: colors.textSecondary, marginBottom: "1rem" }}>{t(`landing.pricing${tier.key}Desc`)}</p>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: colors.accent, marginBottom: "1.5rem" }}>{t(`landing.pricing${tier.key}Price`)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
                  {Array.from({ length: tier.features }, (_, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", fontSize: "0.9rem", color: colors.text }}>
                      <CheckCircle size={16} color={colors.accent} weight="fill" />
                      {t(`landing.pricing${tier.key}Feature${fi + 1}`)}
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                  onClick={() => nav(tier.key === "Starter" ? "/register" : "/contact")}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: 12, background: popular ? colors.accent : colors.surface,
                    color: popular ? "#fff" : colors.accent, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                    border: popular ? "none" : `1px solid ${colors.border}`,
                  }}
                >
                  {t(`landing.pricing${tier.key}Cta`)}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
