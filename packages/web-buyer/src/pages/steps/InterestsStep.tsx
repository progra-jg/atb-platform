import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plant, MapPin, Scales, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { PRODUCT_OPTIONS, REGION_OPTIONS, StepProps } from "../../types/onboarding";

const VOLUME_OPTIONS = [
  { key: "1", labelKey: "estimatedVolume1" },
  { key: "2", labelKey: "estimatedVolume2" },
  { key: "3", labelKey: "estimatedVolume3" },
  { key: "4", labelKey: "estimatedVolume4" },
  { key: "5", labelKey: "estimatedVolume5" },
];

const PRODUCT_EMOJI: Record<string, string> = {
  cacao: "🍫", coton: "🧶", anacarde: "🥜", cafe: "☕",
  mais: "🌽", soja: "🫘", manioc: "🌱", riz: "🍚",
  sesame: "🌰", fruits: "🍍", legumes: "🥬", huile_palme: "🫒",
  autres: "📦",
};

const SECTION_META = [
  { key: "products", icon: Plant, labelKey: "onboarding.wizard.productsInterest", options: PRODUCT_OPTIONS, emoji: PRODUCT_EMOJI },
  { key: "regions", icon: MapPin, labelKey: "onboarding.wizard.regionsInterest", options: REGION_OPTIONS, emoji: null },
] as const;

export function InterestsStep({ data, save, t, colors, isDark }: StepProps) {
  const [products, setProducts] = useState<string[]>(data.productsOfInterest ?? []);
  const [regions, setRegions] = useState<string[]>(data.regionsOfInterest ?? []);
  const [volume, setVolume] = useState(data.estimatedMonthlyVolume ?? "");
  const [search, setSearch] = useState("");

  const toggleProducts = async (item: string) => {
    const updated = products.includes(item) ? products.filter((i) => i !== item) : [...products, item];
    setProducts(updated);
    await save({ productsOfInterest: updated });
  };

  const toggleRegions = async (item: string) => {
    const updated = regions.includes(item) ? regions.filter((i) => i !== item) : [...regions, item];
    setRegions(updated);
    await save({ regionsOfInterest: updated });
  };

  const handleVolume = async (v: string) => {
    setVolume(v);
    await save({ estimatedMonthlyVolume: v });
  };

  const lastChecked = [...products, ...regions].length > 0 && volume;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Search filter for products */}
        <div style={{ position: "relative" }}>
          <MagnifyingGlass size={14} weight="regular" style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: colors.textMuted, pointerEvents: "none",
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("onboarding.wizard.searchProducts")}
            style={{
              width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10,
              border: `1px solid ${colors.borderLight}`,
              background: colors.inputBg, color: colors.text,
              fontSize: 12, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box", transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = colors.accent}
            onBlur={(e) => e.target.style.borderColor = colors.borderLight}
          />
        </div>

        {/* Products grid */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
              <Plant size={14} color={colors.accent} />
              {t("onboarding.wizard.productsInterest")}
            </div>
            {products.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: colors.accent,
                background: `${colors.accent}0c`, padding: "2px 8px",
                borderRadius: 6,
              }}>
                {products.length} {t("onboarding.wizard.selected")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PRODUCT_OPTIONS.filter((p) => !search || t(`products.${p}`).toLowerCase().includes(search.toLowerCase())).map((product, i) => {
              const selected = products.includes(product);
              return (
                <motion.button
                  key={product}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleProducts(product)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 12,
                    fontWeight: selected ? 600 : 500,
                    border: `1px solid ${selected ? colors.accent : colors.borderLight}`,
                    background: selected ? `${colors.accent}0c` : "transparent",
                    color: selected ? colors.accent : colors.textSecondary,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    display: "inline-flex", alignItems: "center", gap: 5,
                    boxShadow: selected ? `0 0 0 1px ${colors.accent}20` : "none",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{PRODUCT_EMOJI[product] || "🌾"}</span>
                  {t(`products.${product}`)}
                  {selected && <Check size={10} weight="bold" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Regions */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={14} color={colors.accent} />
              {t("onboarding.wizard.regionsInterest")}
            </div>
            {regions.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: colors.accent,
                background: `${colors.accent}0c`, padding: "2px 8px",
                borderRadius: 6,
              }}>
                {regions.length} {t("onboarding.wizard.selected")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REGION_OPTIONS.map((region, i) => {
              const selected = regions.includes(region);
              return (
                <motion.button
                  key={region}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i, duration: 0.25 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleRegions(region)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 12,
                    fontWeight: selected ? 600 : 500,
                    border: `1px solid ${selected ? colors.accent : colors.borderLight}`,
                    background: selected ? `${colors.accent}0c` : "transparent",
                    color: selected ? colors.accent : colors.textSecondary,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}
                >
                  {t(`regions.${region}`)}
                  {selected && <Check size={10} weight="bold" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Volume */}
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600, marginBottom: 8, color: colors.text,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Scales size={14} color={colors.accent} />
            {t("onboarding.wizard.estimatedVolume")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {VOLUME_OPTIONS.map(({ key, labelKey }, i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.25 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVolume(key)}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12,
                  fontWeight: volume === key ? 600 : 500,
                  border: `1px solid ${volume === key ? colors.accent : colors.borderLight}`,
                  background: volume === key ? `${colors.accent}0c` : "transparent",
                  color: volume === key ? colors.accent : colors.textSecondary,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s ease",
                }}
              >
                {t(`onboarding.wizard.${labelKey}`)}
              </motion.button>
            ))}
          </div>
        </div>

        {lastChecked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "10px 14px", borderRadius: 10,
              background: `${colors.accent}06`,
              border: `1px solid ${colors.accent}15`,
              fontSize: 11, color: colors.textSecondary, lineHeight: 1.5,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <Check size={14} color={colors.accent} weight="bold" />
            {t("onboarding.wizard.interestsComplete", {
              products: products.length,
              regions: regions.length,
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
