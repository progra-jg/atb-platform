import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MagnifyingGlass, ShoppingCart, Leaf, DotsThree, ArrowRight } from "@phosphor-icons/react";
import type { UserType, StepProps } from "../../types/onboarding";

const TYPE_META: Record<UserType, { icon: React.ElementType; labelSuffix: string; descKey: string; gradient: string }> = {
  potential_buyer: {
    icon: MagnifyingGlass, labelSuffix: "Potential", descKey: "onboarding.wizard.userTypePotentialDesc",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  active_buyer: {
    icon: ShoppingCart, labelSuffix: "Active", descKey: "onboarding.wizard.userTypeActiveDesc",
    gradient: "linear-gradient(135deg, #059669, #10b981)",
  },
  farmer: {
    icon: Leaf, labelSuffix: "Farmer", descKey: "onboarding.wizard.userTypeFarmerDesc",
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
  },
  other: {
    icon: DotsThree, labelSuffix: "Other", descKey: "onboarding.wizard.userTypeOtherDesc",
    gradient: "linear-gradient(135deg, #6b7280, #9ca3af)",
  },
};

const CARD_ORDER: UserType[] = ["potential_buyer", "active_buyer", "farmer", "other"];

export function ProfilStep({ data, save, t, colors }: StepProps) {
  const [userType, setUserType] = useState<UserType>(data.userType ?? "potential_buyer");
  const [hovered, setHovered] = useState<UserType | null>(null);

  const handleUserType = async (type: UserType) => {
    setUserType(type);
    await save({ userType: type });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginBottom: 4,
      }}>
        {CARD_ORDER.map((type, i) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const isSelected = userType === type;
          const isHovered = hovered === type;

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleUserType(type)}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", flexDirection: "column", gap: 10,
                padding: "18px 16px", borderRadius: 14, textAlign: "left", width: "100%",
                border: `1.5px solid ${isSelected ? colors.accent : colors.borderLight}`,
                background: isSelected ? `${colors.accent}06` : colors.surface,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.25s ease", position: "relative", overflow: "hidden",
                boxShadow: isSelected
                  ? `0 0 0 1px ${colors.accent}20, ${colors.shadowSm}`
                  : isHovered ? `${colors.shadowSm}` : "none",
                transform: isSelected ? "translateY(-2px)" : isHovered ? "translateY(-1px)" : "translateY(0)",
              }}
            >
              {/* Selected indicator bar */}
              {isSelected && (
                <motion.div
                  layoutId="typeBar"
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}60, transparent)`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isSelected ? meta.gradient : (isHovered ? `${colors.accent}10` : colors.surfaceHover),
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.25s ease",
                border: `1px solid ${isSelected ? 'transparent' : colors.borderLight}`,
              }}>
                <Icon size={20} color={isSelected ? "#fff" : colors.textMuted} weight={isSelected ? "fill" : "regular"} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: colors.text,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {t(`onboarding.wizard.userType${meta.labelSuffix}`)}
                </div>
                <div style={{
                  fontSize: 11, color: colors.textMuted, marginTop: 3,
                  lineHeight: 1.4, // clamp to 2 lines
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                } as any}>
                  {t(meta.descKey)}
                </div>
              </div>

              {/* Selection indicator */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s ease",
              }}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    style={{ width: 10, height: 10, borderRadius: "50%", background: colors.accent }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {userType && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 14, padding: "12px 16px", borderRadius: 12,
            background: `${colors.accent}06`,
            border: `1px solid ${colors.accent}15`,
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <ArrowRight size={14} color={colors.accent} weight="bold" />
          <span style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
            {t(`onboarding.wizard.userType${TYPE_META[userType].labelSuffix}Hint`)}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
