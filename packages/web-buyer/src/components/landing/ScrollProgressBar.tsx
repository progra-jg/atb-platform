import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function ScrollProgressBar({ progress, visible }: { progress: number; visible: boolean }) {
  const { colors } = useTheme();
  return (
    <motion.div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 200,
      background: `linear-gradient(90deg, ${colors.accent}, ${colors.gold})`,
      transformOrigin: "0% 50%",
      scaleX: progress,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }} />
  );
}
