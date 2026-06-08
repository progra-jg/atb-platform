import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { type ThemeColors } from "../../context/ThemeContext";

export default function FAQ({ colors }: { colors: ThemeColors }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const items = t("landing.faq", { returnObjects: true }) as { q: string; a: string }[];

  return (
    <section ref={ref} id="faq" style={{ padding: "5rem 1rem", background: colors.bg }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, textAlign: "center", color: colors.text, marginBottom: "0.75rem" }}
        >
          {t("landing.faqTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ textAlign: "center", color: colors.textSecondary, marginBottom: "3rem", fontSize: "1.05rem" }}
        >
          {t("landing.faqDesc")}
        </motion.p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              style={{
                background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`,
                overflow: "hidden", cursor: "pointer",
              }}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", gap: "1rem" }}>
                <span style={{ fontWeight: 600, fontSize: "1rem", color: colors.text, lineHeight: 1.4 }}>{item.q}</span>
                <motion.span
                  animate={{ rotate: openIdx === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexShrink: 0, color: colors.accent }}
                >
                  <Plus size={20} weight="bold" />
                </motion.span>
              </div>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 1.25rem 1.25rem", color: colors.textSecondary, fontSize: "0.95rem", lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
