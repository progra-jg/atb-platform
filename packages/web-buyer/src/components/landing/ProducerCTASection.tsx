import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { ease } from "./data";
import MagneticButton from "./MagneticButton";
import { TrendUp, ArrowRight } from "@phosphor-icons/react";

interface ProducerCTASectionProps {
  onRegister: () => void;
  onContact: () => void;
}

export default function ProducerCTASection({ onRegister, onContact }: ProducerCTASectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <section style={{ padding: "40px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease }}
        style={{
          maxWidth: 900, margin: "0 auto",
          background: colors.accentGradient,
          borderRadius: 20, padding: "40px 32px", textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: [
            "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)",
            "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)",
          ].join(", "),
        }} aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            {t("landing.producerTitle")}
          </h3>
          <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "rgba(255,255,255,0.8)", margin: "0 auto 24px", maxWidth: 600, lineHeight: 1.6 }}>
            {t("landing.producerDesc")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <MagneticButton onClick={onRegister}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 12,
                background: "#fff", color: colors.accentDark,
                fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", border: "none",
              }}>
              {t("landing.producerCta")} <TrendUp size={18} />
            </MagneticButton>
            <MagneticButton onClick={onContact}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.08)", color: "#fff",
                fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}>
              {t("landing.contactUs")} <ArrowRight size={16} />
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
