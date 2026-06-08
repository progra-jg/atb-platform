import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "../../utils/animations";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerContainer({ children, className, style }: StaggerContainerProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export function StaggerItem({ children, className, delay, style }: StaggerItemProps) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
