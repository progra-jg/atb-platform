import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Building, Users, Briefcase, IdentificationCard } from "@phosphor-icons/react";
import type { CompanySize, StepProps } from "../../types/onboarding";

const SIZE_LABELS: [CompanySize, string][] = [
  ["1-10", "companySize1"],
  ["11-50", "companySize2"],
  ["51-200", "companySize3"],
  ["200+", "companySize4"],
];

const SECTOR_KEYS = [
  { key: "agri", labelKey: "companySectorAgri" },
  { key: "dist", labelKey: "companySectorDist" },
  { key: "transfo", labelKey: "companySectorTransfo" },
  { key: "serv", labelKey: "companySectorServ" },
  { key: "other", labelKey: "companySectorOther" },
];

export function CompanyStep({ data, save, t, colors, isDark }: StepProps) {
  const [hasCompany, setHasCompany] = useState(data.hasCompany ?? false);
  const [companyName, setCompanyName] = useState(data.companyName ?? "");
  const [companySize, setCompanySize] = useState<CompanySize | "">(data.companySize ?? "");
  const [companySector, setCompanySector] = useState(data.companySector ?? "");
  const [ifu, setIfu] = useState(data.ifu ?? "");

  const handleToggle = async () => {
    const newVal = !hasCompany;
    setHasCompany(newVal);
    await save({ hasCompany: newVal });
    if (!newVal) {
      setCompanyName(""); setCompanySize(""); setCompanySector(""); setIfu("");
      await save({ companyName: "", companySize: "", companySector: "", ifu: "" });
    }
  };

  const fieldStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${colors.borderLight}`,
    background: colors.inputBg, color: colors.text,
    fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box" as const, transition: "border-color 0.2s",
  };

  const chipDef = (selected: boolean) => ({
    padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
    border: `1px solid ${selected ? colors.accent : colors.borderLight}`,
    background: selected ? `${colors.accent}0c` : "transparent",
    color: selected ? colors.accent : colors.textSecondary,
    cursor: "pointer" as const, fontFamily: "inherit" as const,
    transition: "all 0.2s ease",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{
        display: "flex", gap: 8, marginBottom: 20,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        borderRadius: 12, padding: 4,
      }}>
        {[true, false].map((val) => (
          <button
            key={String(val)}
            onClick={handleToggle}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
              background: hasCompany === val ? (isDark ? "rgba(255,255,255,0.08)" : "#fff") : "transparent",
              color: hasCompany === val ? colors.text : colors.textMuted,
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              cursor: "pointer", transition: "all 0.2s ease",
              boxShadow: hasCompany === val ? (isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)") : "none",
            }}
          >
            {val && <Building size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />}
            {t(val ? "onboarding.wizard.hasCompanyYes" : "onboarding.wizard.hasCompanyNo")}
          </button>
        ))}
      </div>

      {hasCompany && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, display: "block", color: colors.textSecondary }}>
              {t("onboarding.wizard.companyName")}
            </label>
            <input
              type="text" value={companyName}
              onChange={async (e) => { const v = e.target.value; setCompanyName(v); await save({ companyName: v }); }}
              placeholder={t("onboarding.wizard.companyNamePlaceholder")}
              style={fieldStyle}
              onFocus={(e) => e.target.style.borderColor = colors.accent}
              onBlur={(e) => e.target.style.borderColor = colors.borderLight}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, display: "block", color: colors.textSecondary }}>
              <Users size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("onboarding.wizard.companySize")}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SIZE_LABELS.map(([size, labelKey]) => (
                <button
                  key={size}
                  onClick={async () => { setCompanySize(size); await save({ companySize: size }); }}
                  style={chipDef(companySize === size)}
                >
                  {t(`onboarding.wizard.${labelKey}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, display: "block", color: colors.textSecondary }}>
              <Briefcase size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("onboarding.wizard.companySector")}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SECTOR_KEYS.map(({ key, labelKey }) => (
                <button
                  key={key}
                  onClick={async () => { setCompanySector(key); await save({ companySector: key }); }}
                  style={chipDef(companySector === key)}
                >
                  {t(`onboarding.wizard.${labelKey}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, display: "block", color: colors.textSecondary }}>
              <IdentificationCard size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("onboarding.wizard.ifu")}
            </label>
            <input
              type="text" value={ifu}
              onChange={async (e) => { const v = e.target.value; setIfu(v); await save({ ifu: v }); }}
              placeholder={t("onboarding.wizard.ifuPlaceholder")}
              style={fieldStyle}
              onFocus={(e) => e.target.style.borderColor = colors.accent}
              onBlur={(e) => e.target.style.borderColor = colors.borderLight}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
