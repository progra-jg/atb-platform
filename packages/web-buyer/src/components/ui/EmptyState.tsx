import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { staggerContainer, staggerItem } from "../../lib/motion-variants";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({ icon, title, message, action, compact }: EmptyStateProps) {
  const { colors, tokens } = useTheme();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: compact ? tokens.space.xl : tokens.space.xxl,
        minHeight: compact ? 200 : 320,
      }}
    >
      {icon ? (
        <motion.div variants={staggerItem} style={{ marginBottom: tokens.space.lg, opacity: 0.5 }}>
          {icon}
        </motion.div>
      ) : (
        <motion.svg variants={staggerItem} width={compact ? 48 : 64} height={compact ? 48 : 64} viewBox="0 0 64 64" fill="none" style={{ marginBottom: tokens.space.lg }}>
          <circle cx="32" cy="32" r="28" stroke={colors.border} strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <motion.circle
            cx="32" cy="32" r="28" stroke={colors.accent} strokeWidth="2"
            strokeDasharray="100" strokeDashoffset="100"
            fill="none" strokeLinecap="round"
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <path d="M24 34l6 6 10-12" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.svg>
      )}
      <motion.h3 variants={staggerItem} style={{
        fontSize: compact ? 16 : 18, fontWeight: 600, color: colors.text,
        margin: 0, marginBottom: tokens.space.sm,
      }}>
        {title}
      </motion.h3>
      {message && (
        <motion.p variants={staggerItem} style={{
          fontSize: 14, color: colors.textSecondary, maxWidth: 340,
          margin: 0, marginBottom: tokens.space.lg, lineHeight: 1.6,
        }}>
          {message}
        </motion.p>
      )}
      {action && (
        <motion.button
          variants={staggerItem}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          style={{
            padding: "10px 20px", borderRadius: colors.radiusMd, border: "none",
            background: colors.accent, color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "opacity 0.15s",
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

export function EmptyStateCard({ icon, title, message, action, compact }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <div style={{
      background: colors.surface, borderRadius: colors.radiusLg,
      border: `1px solid ${colors.borderLight}`, overflow: "hidden",
    }}>
      <EmptyState icon={icon} title={title} message={message} action={action} compact={compact} />
    </div>
  );
}
