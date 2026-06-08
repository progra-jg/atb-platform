import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { STATS } from "./data";
import AnimatedNumber from "./AnimatedNumber";

export default function StatsSection() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <section style={{ padding: "0 24px 60px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1,
          borderRadius: 16, overflow: "hidden",
          background: alphaColor(isDark, 0.06), border: `1px solid ${alphaColor(isDark, 0.06)}`,
        }}>
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{
                padding: "20px 16px", textAlign: "center",
                background: alphaColor(isDark, 0.02),
                borderRight: i < STATS.length - 1 ? `1px solid ${alphaColor(isDark, 0.06)}` : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${colors.accent}20, ${colors.accent}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px", color: colors.accent,
                }}><Icon size={15} weight="fill" /></div>
                <div style={{ fontSize: "clamp(26px, 3.5vw, 34px)", fontWeight: 800, color: colors.accent, marginBottom: 2 }}>
                  <AnimatedNumber to={s.target} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: alphaColor(isDark, 0.45), fontWeight: 500 }}>{t(s.labelKey)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
