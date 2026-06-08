import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { type ThemeColors } from "../../context/ThemeContext";

export default function ComparisonGrid({ colors }: { colors: ThemeColors }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const rows = t("landing.comparRows", { returnObjects: true }) as { label: string; trad: string; atb: string }[];

  return (
    <section ref={ref} style={{ padding: "5rem 1rem", background: colors.bg }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, textAlign: "center", color: colors.text, marginBottom: "0.75rem" }}
        >
          {t("landing.comparTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ textAlign: "center", color: colors.textSecondary, marginBottom: "3rem", fontSize: "1.05rem" }}
        >
          {t("landing.comparDesc")}
        </motion.p>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div key="h" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "0.5rem", padding: "1rem 1.25rem", background: colors.surface, borderBottom: `1px solid ${colors.border}`, fontWeight: 600, fontSize: "0.9rem" }}>
            <span style={{ color: colors.text }}></span>
            <span style={{ color: colors.textSecondary, textAlign: "center" }}>Traditionnel</span>
            <span style={{ color: colors.accent, textAlign: "center" }}>ATB AgriTrace</span>
          </div>
          {rows.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "0.5rem", padding: "1rem 1.25rem", borderBottom: i < rows.length - 1 ? `1px solid ${colors.border}` : "none", alignItems: "center", fontSize: "0.9rem" }}
            >
              <span style={{ color: colors.text, fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: colors.textMuted, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <XCircle size={16} color={colors.textMuted} weight="fill" /> {r.trad}
              </span>
              <span style={{ color: colors.accent, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <CheckCircle size={16} color={colors.accent} weight="fill" /> {r.atb}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
