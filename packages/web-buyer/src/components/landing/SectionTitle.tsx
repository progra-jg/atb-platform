import { motion, type Variants } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { ease } from "./data";

export interface SectionTitleProps {
  label?: string;
  title: string;
  desc: string;
}

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05, ease },
  },
};

const childFade: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease },
  },
};

export default function SectionTitle({ label, title, desc }: SectionTitleProps) {
  const { colors } = useTheme();
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
      variants={container} style={{ textAlign: "center", marginBottom: 48 }}>
      {label && (
        <motion.span variants={childFade} style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 999,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase",
          background: colors.accentLight, color: colors.accent, marginBottom: 12,
        }}>{label}</motion.span>
      )}
      <motion.h2 variants={childFade} style={{
        fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700,
        margin: "0 0 12px", letterSpacing: "-0.5px", color: colors.text,
      }}>{title}</motion.h2>
      <motion.p variants={childFade} style={{ fontSize: 15, color: colors.textMuted, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{desc}</motion.p>
    </motion.div>
  );
}
