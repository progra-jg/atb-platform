import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { ease } from "./data";

export default function LogoCloudSection({ titleKey, items }: { titleKey: string; items: readonly string[] }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
      }}
      style={{ padding: "40px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{
          textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "2px",
          textTransform: "uppercase", color: alphaColor(isDark, 0.3), marginBottom: 28,
        }}>{t(titleKey)}</p>
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: "clamp(12px, 2vw, 24px)", flexWrap: "wrap",
        }}>
          {items.map((name, i) => (
            <motion.span key={name} initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              style={{
                padding: "6px 18px", borderRadius: 999,
                background: alphaColor(isDark, 0.03),
                border: `1px solid ${alphaColor(isDark, 0.06)}`,
                fontSize: 12, fontWeight: 600, color: alphaColor(isDark, 0.4),
                letterSpacing: "0.3px", whiteSpace: "nowrap", display: "inline-block",
              }}>
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
