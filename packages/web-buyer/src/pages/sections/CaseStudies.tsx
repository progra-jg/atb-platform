import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { Leaf, ChartBar, Globe, Star } from "@phosphor-icons/react";
import { type ThemeColors } from "../../context/ThemeContext";

export default function CaseStudies({ colors }: { colors: ThemeColors }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const items = t("landing.cases", { returnObjects: true }) as { icon: string; title: string; result: string; desc: string }[];
  const IconMap: Record<string, React.ElementType> = { Leaf, ChartBar, Globe };

  return (
    <section ref={ref} style={{ padding: "5rem 1rem", background: colors.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, textAlign: "center", color: colors.text, marginBottom: "0.75rem" }}
        >
          {t("landing.caseTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ textAlign: "center", color: colors.textSecondary, marginBottom: "3rem", fontSize: "1.05rem" }}
        >
          {t("landing.caseDesc")}
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>
          {items.map((item, i) => {
            const IconComp = IconMap[item.icon] || Star;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                style={{ background: colors.bg, borderRadius: 16, padding: "1.75rem", border: `1px solid ${colors.border}`, transition: "transform .25s,box-shadow .25s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = colors.shadowLg; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${colors.accent}20,${colors.accent}08)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <IconComp size={22} color={colors.accent} weight="fill" />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: colors.text, marginBottom: "0.35rem" }}>{item.title}</h3>
                <span style={{ display: "inline-block", background: `${colors.accent}18`, color: colors.accent, fontWeight: 600, fontSize: "0.85rem", padding: "0.2rem 0.65rem", borderRadius: 20, marginBottom: "0.75rem" }}>{item.result}</span>
                <p style={{ fontSize: "0.9rem", color: colors.textSecondary, lineHeight: 1.65 }}>{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
