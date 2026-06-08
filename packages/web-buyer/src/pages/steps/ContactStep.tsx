import { useState } from "react";
import { motion } from "framer-motion";
import { Envelope, Phone, WhatsappLogo, CheckSquare } from "@phosphor-icons/react";
import PhoneInput from "../../components/PhoneInput";
import type { ContactPreference, StepProps } from "../../types/onboarding";

const PREF_META: Record<ContactPreference, { icon: React.ElementType; displayName: string }> = {
  email: { icon: Envelope, displayName: "Email" },
  phone: { icon: Phone, displayName: "Phone" },
  whatsapp: { icon: WhatsappLogo, displayName: "WhatsApp" },
};

export function ContactStep({ data, save, t, colors, isDark }: StepProps) {
  const [phone, setPhone] = useState(data.phone ?? "");
  const [contactPreference, setContactPreference] = useState<ContactPreference>(data.contactPreference ?? "email");
  const [acceptNewsletter, setAcceptNewsletter] = useState(data.acceptNewsletter ?? true);

  const c = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;

  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    await save({ phone: value });
  };

  const handleContactPreference = async (pref: ContactPreference) => {
    setContactPreference(pref);
    await save({ contactPreference: pref });
  };

  const handleNewsletterToggle = async () => {
    const newValue = !acceptNewsletter;
    setAcceptNewsletter(newValue);
    await save({ acceptNewsletter: newValue });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, display: "block", color: colors.textSecondary }}>
            {t("onboarding.wizard.phone")}
          </label>
          <PhoneInput
            value={phone}
            onChange={handlePhoneChange}
            countryCode="BJ"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, display: "block", color: colors.textSecondary }}>
            {t("onboarding.wizard.contactPref")}
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {(["email", "phone", "whatsapp"] as ContactPreference[]).map((pref) => {
              const meta = PREF_META[pref];
              const Icon = meta.icon;
              const isSelected = contactPreference === pref;
              return (
                <button
                  key={pref}
                  onClick={() => handleContactPreference(pref)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    border: `1px solid ${isSelected ? colors.accent : colors.borderLight}`,
                    background: isSelected ? `${colors.accent}08` : "transparent",
                    color: isSelected ? colors.accent : colors.textSecondary,
                    cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12, fontWeight: 500,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={16} weight={isSelected ? "fill" : "regular"} />
                  {t(`onboarding.wizard.contactPref${meta.displayName}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          onClick={handleNewsletterToggle}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", padding: "14px 16px", borderRadius: 12,
            background: acceptNewsletter ? `${colors.accent}06` : "transparent",
            border: `1px solid ${acceptNewsletter ? `${colors.accent}30` : colors.borderLight}`,
            transition: "all 0.2s ease",
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${acceptNewsletter ? colors.accent : c(0.2)}`,
            background: acceptNewsletter ? colors.accent : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.25s ease",
          }}>
            {acceptNewsletter && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <CheckSquare size={14} color="#fff" weight="fill" />
              </motion.div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
              {t("onboarding.wizard.newsletter")}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
              {t("onboarding.wizard.newsletterDesc")}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
