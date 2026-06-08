import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { TESTIMONIALS, ease } from "./data";
import SectionTitle from "./SectionTitle";
import { Quotes, Star } from "@phosphor-icons/react";

const ITEMS_PER_PAGE = 3;
const AUTO_ADVANCE_MS = 8000;
const NODE_CYCLE_BASE = 3;

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const totalPages = Math.ceil(TESTIMONIALS.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages <= 1 || paused) return;
    const timer = setInterval(() => setPage((p) => (p + 1) % totalPages), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [totalPages, paused]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPage((p) => (p - 1 + totalPages) % totalPages);
    else if (e.key === "ArrowRight") setPage((p) => (p + 1) % totalPages);
  }, [totalPages]);

  return (
    <section id="testimonials" style={{ padding: "60px 24px 80px", background: colors.surface }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <SectionTitle
        label={t("landing.testimonialsLabel")}
        title={t("landing.testimonialsTitle")}
        desc={t("landing.testimonialsDesc")}
      />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <motion.div key={page} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE).map((item) => {
            const prefix = `landing.testimonials.${item.id}`;
            return (
              <motion.div key={item.id}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                style={{
                  padding: "24px 20px", borderRadius: 14,
                  background: colors.bg, border: `1px solid ${alphaColor(isDark, 0.06)}`,
                  display: "flex", flexDirection: "column",
                }}>
                <Quotes size={20} color={colors.accent} opacity={0.3} style={{ marginBottom: 10 }} aria-hidden="true" />
                <p style={{
                  fontSize: 13, lineHeight: 1.7, color: colors.textSecondary,
                  flex: 1, margin: "0 0 16px", fontStyle: "italic",
                }}>"{t(`${prefix}.quote`)}"</p>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <Star key={j} size={12} weight="fill" color={colors.gold} />
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{t(`${prefix}.author`)}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{t(`${prefix}.role`)}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        {totalPages > 1 && (
          <div role="tablist" aria-label={t("landing.testimonialsLabel")}
            style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <motion.button key={i}
                role="tab"
                aria-selected={i === page}
                aria-label={`${t("landing.testimonialsLabel")} ${i + 1}`}
                onClick={() => setPage(i)}
                onKeyDown={handleKeyDown}
                whileHover={{ scale: 1.4 }} whileTap={{ scale: 0.8 }}
                animate={{
                  scale: i === page ? 1 : 0.85,
                  background: i === page ? colors.accent : alphaColor(isDark, 0.15),
                }}
                transition={{ duration: 0.35, ease }}
                style={{
                  width: 10, height: 10, borderRadius: "50%", border: "none",
                  padding: 0, cursor: "pointer",
                  boxShadow: i === page ? `0 0 8px ${colors.accent}55` : "none",
                }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
