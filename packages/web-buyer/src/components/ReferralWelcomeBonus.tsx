import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkle, X } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

const REFERRAL_BONUS_KEY = "atb_referral_bonus";

interface ReferralBonus {
  amount: number;
  currency: string;
  inviterName?: string;
}

export function saveReferralBonus(bonus: ReferralBonus): void {
  localStorage.setItem(REFERRAL_BONUS_KEY, JSON.stringify(bonus));
}

export function clearReferralBonus(): void {
  localStorage.removeItem(REFERRAL_BONUS_KEY);
}

export function getReferralBonus(): ReferralBonus | null {
  try {
    const raw = localStorage.getItem(REFERRAL_BONUS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReferralBonus;
  } catch {
    return null;
  }
}

export default function ReferralWelcomeBonus() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [bonus, setBonus] = useState<ReferralBonus | null>(null);

  useEffect(() => {
    const b = getReferralBonus();
    if (b) setBonus(b);
  }, []);

  const dismiss = () => {
    clearReferralBonus();
    setBonus(null);
  };

  return (
    <AnimatePresence>
      {bonus && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          style={{
            background: `linear-gradient(135deg, #f59e0b, #d97706)`,
            borderRadius: 14, padding: "16px 20px",
            position: "relative", overflow: "hidden",
            boxShadow: "0 4px 24px rgba(245,158,11,0.3)",
          }}
        >
          <div style={{
            position: "absolute", top: -20, right: -20, width: 100, height: 100,
            borderRadius: "50%", background: "rgba(255,255,255,0.1)",
          }} />
          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 24, height: 24, borderRadius: "50%",
              border: "none", background: "rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={12} weight="bold" />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Gift size={22} weight="fill" color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {t("referral.bonusTitle")}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                {bonus.inviterName
                  ? t("referral.bonusFrom", { name: bonus.inviterName })
                  : t("referral.bonusDefault")}
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8,
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
              {bonus.amount.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              {bonus.currency}
            </span>
            <Sparkle size={16} weight="fill" color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
          </div>

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            {t("referral.bonusDesc")}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
