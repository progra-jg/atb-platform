import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, User, Phone, Building, Bank, MapPin,
  FloppyDisk, CheckCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface ProducerProfile {
  company: string;
  phone: string;
  village: string;
  cooperative: string;
  bankName: string;
  bankAccount: string;
}

const STORAGE_KEY = "atb_producer_profile";

export default function ProducerSettings() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<ProducerProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
      company: user?.company || "",
      phone: user?.phone || "",
      village: "",
      cooperative: "",
      bankName: "",
      bankAccount: "",
    };
  });

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
  };

  const fields: { key: keyof ProducerProfile; icon: React.ElementType; label: string }[] = [
    { key: "company", icon: Building, label: t("producer.company") },
    { key: "phone", icon: Phone, label: t("producer.phone") },
    { key: "village", icon: MapPin, label: t("producer.village") },
    { key: "cooperative", icon: User, label: t("producer.cooperative") },
    { key: "bankName", icon: Bank, label: t("producer.bankName") },
    { key: "bankAccount", icon: Bank, label: t("producer.bankAccount") },
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <User size={18} color={colors.accent} weight="bold" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("producer.settings")}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(({ key, icon: Icon, label }) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: colors.surface, borderRadius: 10,
            border: `1px solid ${colors.borderLight}`, padding: "12px 14px",
          }}>
            <Icon size={16} color={colors.textMuted} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: colors.textMuted, display: "block", marginBottom: 2 }}>{label}</label>
              <input
                value={profile[key]}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                style={{
                  width: "100%", border: "none", outline: "none",
                  background: "transparent", fontSize: 14, color: colors.text,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{
        width: "100%", marginTop: 20, padding: "12px 20px", borderRadius: 10,
        border: "none", background: colors.accent, color: "#fff",
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {saved ? <CheckCircle size={18} weight="fill" /> : <FloppyDisk size={18} />}
        {saved ? t("common.saved") : t("common.save")}
      </button>
    </div>
  );
}
