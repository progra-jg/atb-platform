import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useProfileCompleteness } from "../hooks/useProfileCompleteness";
import type { CompletenessSection } from "../hooks/useProfileCompleteness";
import Button from "./ui/Button";
import {
  IdentificationBadge, Buildings, Compass, ChatText, Check, ArrowRight,
} from "@phosphor-icons/react";

const TIER_META: Record<string, { color: string; light: string; gradient: string; label: string }> = {
  platinum: { color: "#48bb78", light: "#48bb7822", gradient: "linear-gradient(135deg, #48bb78, #38a169)", label: "Platinum" },
  gold: { color: "#f6ad55", light: "#f6ad5522", gradient: "linear-gradient(135deg, #f6ad55, #ed8936)", label: "Gold" },
  silver: { color: "#a0aec0", light: "#a0aec022", gradient: "linear-gradient(135deg, #a0aec0, #718096)", label: "Silver" },
  bronze: { color: "#cd7f32", light: "#cd7f3222", gradient: "linear-gradient(135deg, #cd7f32, #b8732a)", label: "Bronze" },
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  identity: IdentificationBadge,
  company: Buildings,
  interests: Compass,
  contact: ChatText,
};

const CIRCUMFERENCE = 2 * Math.PI * 56;

function Ring({ percentage, color }: { percentage: number; color: string }) {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="56" fill="none" stroke="currentColor" strokeWidth="6"
        style={{ color: "var(--border-light, #e2e8f0)", opacity: 0.3 }} />
      <motion.circle
        cx="70" cy="70" r="56" fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", filter: `drop-shadow(0 0 6px ${color}44)` }}
      />
      <motion.circle
        cx="70" cy="70" r="56" fill="none" stroke="url(#ring-grad)" strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", opacity: 0.15 }}
      />
    </svg>
  );
}

function SectionRow({ section, tierColor }: { section: CompletenessSection; tierColor: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const Icon = SECTION_ICONS[section.key];
  const pct = section.total > 0 ? Math.round((section.score / section.total) * 100) : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 10,
      transition: "background 0.15s", cursor: "default",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: section.complete ? `${tierColor}18` : colors.surface,
        border: `1px solid ${section.complete ? `${tierColor}30` : colors.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {section.complete ? (
          <Check size={12} color={tierColor} weight="bold" />
        ) : Icon ? (
          <Icon size={12} color={colors.textMuted} />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
          {t(section.labelKey)}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {section.items.map((item) => (
            <span key={item.key} style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 4,
              background: item.filled ? `${tierColor}12` : colors.surface,
              color: item.filled ? tierColor : colors.textMuted,
              border: `0.5px solid ${item.filled ? `${tierColor}25` : colors.borderLight}`,
              lineHeight: "16px",
            }}>
              {t(item.labelKey)}
            </span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? tierColor : colors.textMuted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {section.score}/{section.total}
      </div>
    </div>
  );
}

export default function ProfileCompletenessCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const completeness = useProfileCompleteness();
  const meta = TIER_META[completeness.tier];

  if (completeness.isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div style={{
          borderRadius: 16, padding: "20px 24px",
          background: `linear-gradient(135deg, ${meta.color}10, ${meta.color}05)`,
          border: `1.5px solid ${meta.color}25`,
          display: "flex", alignItems: "center", gap: 14,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse at 80% 50%, ${meta.color}08 0%, transparent 60%)`,
          }} />
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${meta.color}20`, border: `1.5px solid ${meta.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 18,
          }}>
            <Check size={20} color={meta.color} weight="bold" />
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
              {t("profileCompleteness.completeTitle")}
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
              {t("profileCompleteness.completeDesc")}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div style={{
        borderRadius: 16, overflow: "hidden",
        background: colors.surface, border: `1.5px solid ${colors.border}`,
        boxShadow: colors.shadowSm,
      }}>
        {/* Top: ring + score */}
        <div style={{
          padding: "24px 24px 16px",
          display: "flex", alignItems: "center", gap: 20,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "-40%", right: "-10%", width: "50%", height: "120%",
            background: `radial-gradient(ellipse, ${meta.color}06 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Ring percentage={completeness.percentage} color={meta.color} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}>
              <motion.div
                key={completeness.percentage}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
                style={{ fontSize: 24, fontWeight: 800, color: meta.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
              >
                {completeness.percentage}%
              </motion.div>
              <div style={{ fontSize: 8, color: colors.textMuted, fontWeight: 500, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t("profileCompleteness.score")}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 6,
              background: meta.light, color: meta.color,
              fontSize: 10, fontWeight: 700, marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.6px",
            }}>
              {t(completeness.tierLabelKey)}
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
              {completeness.missingCount === 1
                ? t("profileCompleteness.oneMissing")
                : t("profileCompleteness.missingCount", { count: completeness.missingCount })}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ padding: "0 16px 12px" }}>
          {completeness.sections.map((section) => (
            <SectionRow key={section.key} section={section} tierColor={meta.color} />
          ))}
        </div>

        {/* CTA */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${colors.borderLight}`,
          display: "flex", justifyContent: "center",
        }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/settings?tab=profil")}
            icon={<ArrowRight size={12} />}
          >
            {t("profileCompleteness.cta")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
