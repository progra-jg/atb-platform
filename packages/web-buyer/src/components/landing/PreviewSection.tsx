import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { fadeUp } from "./data";
import SectionTitle from "./SectionTitle";
import { formatNumber, formatCurrency } from "../../utils/format";

export default function PreviewSection() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();

  const formatPrice = (value: number) => formatCurrency(value, "XOF", 0);

  return (
    <section style={{ padding: "60px 24px 80px", background: colors.surface }}>
      <SectionTitle
        label={t("landing.previewLabel")}
        title={t("landing.previewTitle")}
        desc={t("landing.previewDesc")}
      />
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp} style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          boxShadow: `0 20px 60px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)"}`,
          border: `1px solid ${alphaColor(isDark, 0.08)}`,
          background: isDark ? "#0a0f0c" : "#fdfdfc",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
            borderBottom: `1px solid ${alphaColor(isDark, 0.06)}`,
            background: isDark ? "#0e1411" : "#f5f5f3",
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((color) => (
                <div key={color} style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              ))}
            </div>
            <div style={{
              flex: 1, textAlign: "center", fontSize: 10, color: alphaColor(isDark, 0.3),
              background: alphaColor(isDark, 0.04), borderRadius: 6, padding: "3px 12px",
              fontFamily: "'JetBrains Mono', monospace",
            }}>app.agritrace.bj/dashboard</div>
          </div>
          <div style={{ padding: "clamp(16px, 3vw, 32px)", display: "grid", gap: "clamp(10px, 2vw, 20px)", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{
              height: "clamp(60px, 8vw, 100px)", borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}08)`,
              border: `1px solid ${alphaColor(isDark, 0.04)}`, display: "flex",
              flexDirection: "column", justifyContent: "center", padding: "8px 14px",
            }}>
              <div style={{ fontSize: 9, color: alphaColor(isDark, 0.3), marginBottom: 4, fontWeight: 500 }}>
                {t("dashboard.stats.lots")}
              </div>
              <div style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: colors.accent }}>
                {formatNumber(2432)}
              </div>
            </div>
            <div style={{
              height: "clamp(60px, 8vw, 100px)", borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.gold}15, ${colors.gold}08)`,
              border: `1px solid ${alphaColor(isDark, 0.04)}`, display: "flex",
              flexDirection: "column", justifyContent: "center", padding: "8px 14px",
            }}>
              <div style={{ fontSize: 9, color: alphaColor(isDark, 0.3), marginBottom: 4, fontWeight: 500 }}>
                {t("common.price")}
              </div>
              <div style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: colors.gold }}>
                {formatPrice(485)}
              </div>
            </div>
            <div style={{
              gridColumn: "1 / -1", height: "clamp(120px, 15vw, 200px)", borderRadius: 10,
              background: `linear-gradient(180deg, ${alphaColor(isDark, 0.02)}, ${alphaColor(isDark, 0.04)})`,
              border: `1px solid ${alphaColor(isDark, 0.04)}`, position: "relative", overflow: "hidden",
              display: "flex", alignItems: "flex-end", padding: "clamp(12px, 2vw, 20px)",
              gap: "clamp(4px, 1vw, 10px)",
            }}>
              {[35, 48, 32, 55, 42, 58, 45, 62, 50, 44, 56, 38, 52, 60, 46].map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0",
                  background: `linear-gradient(180deg, ${colors.accent}40, ${colors.accent}15)`,
                  transition: "height 0.3s ease",
                }} />
              ))}
              <div style={{
                position: "absolute", top: 8, left: 12,
                fontSize: 9, color: alphaColor(isDark, 0.3), fontWeight: 500,
              }}>{t("dashboard.marketPrices.title")}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
