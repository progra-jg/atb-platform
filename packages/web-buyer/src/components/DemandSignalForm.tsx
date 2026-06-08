import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { createDemandSignal } from "../services/demand";
import { CROPS_LIST, type DemandUrgency } from "../types/demand";
import { Plus, Check, Spinner, X, MapPin, Timer } from "@phosphor-icons/react";

interface DemandSignalFormProps {
  onCreated?: () => void;
  onClose?: () => void;
}

const URGENCY_OPTIONS: { key: DemandUrgency; icon: string }[] = [
  { key: "immediate", icon: "🔴" },
  { key: "this_week", icon: "🟡" },
  { key: "this_month", icon: "🟢" },
  { key: "flexible", icon: "🔵" },
];

export default function DemandSignalForm({ onCreated, onClose }: DemandSignalFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [crop, setCrop] = useState("");
  const [volumeKg, setVolumeKg] = useState("");
  const [maxPriceFcfa, setMaxPriceFcfa] = useState("");
  const [region, setRegion] = useState("");
  const [urgency, setUrgency] = useState<DemandUrgency>("flexible");
  const [description, setDescription] = useState("");
  const [certInput, setCertInput] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!crop || !volumeKg || !maxPriceFcfa || !user?.id) return;
    setSubmitting(true);
    setError("");
    try {
      await createDemandSignal(
        user.id, user.company || user.email || "Acheteur", user.company || "",
        crop, parseInt(volumeKg), parseInt(maxPriceFcfa),
        region || "Bénin", urgency, description, certs,
      );
      setDone(true);
      onCreated?.();
    } catch {
      setError(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: 32, borderRadius: 20, textAlign: "center",
          background: colors.surface, border: `1px solid ${colors.borderLight}`,
        }}
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          style={{
            width: 56, height: 56, borderRadius: 28,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Check size={28} color="#fff" weight="bold" />
        </motion.div>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("demand.created")}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.4 }}>
          {t("demand.createdDesc")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24, borderRadius: 20,
        background: colors.surface, border: `1px solid ${colors.borderLight}`,
        position: "relative",
      }}
    >
      {onClose && (
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          background: "none", border: "none", color: colors.textMuted,
          cursor: "pointer", padding: 4,
        }}>
          <X size={16} />
        </button>
      )}

      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: colors.text }}>
        {t("demand.formTitle")}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${colors.borderLight}`,
            background: colors.inputBg, color: colors.text,
            fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
        >
          <option value="">{t("demand.cropPlaceholder")}</option>
          {CROPS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            value={volumeKg}
            onChange={(e) => setVolumeKg(e.target.value.replace(/\D/g, ""))}
            placeholder={t("demand.volumePlaceholder")}
            type="text" inputMode="numeric"
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${colors.borderLight}`,
              background: colors.inputBg, color: colors.text,
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
          <input
            value={maxPriceFcfa}
            onChange={(e) => setMaxPriceFcfa(e.target.value.replace(/\D/g, ""))}
            placeholder={t("demand.pricePlaceholder")}
            type="text" inputMode="numeric"
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${colors.borderLight}`,
              background: colors.inputBg, color: colors.text,
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder={t("demand.regionPlaceholder")}
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${colors.borderLight}`,
              background: colors.inputBg, color: colors.text,
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>
            {t("demand.urgencyLabel")}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {URGENCY_OPTIONS.map((u) => (
              <motion.button
                key={u.key}
                onClick={() => setUrgency(u.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8,
                  border: `1px solid ${urgency === u.key ? colors.accent : colors.borderLight}`,
                  background: urgency === u.key ? `${colors.accent}0c` : "transparent",
                  color: colors.text, fontSize: 10, fontWeight: 500,
                  cursor: "pointer", textAlign: "center", fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 2 }}>{u.icon}</div>
                {t(URGENCY_LABELS[u.key])}
              </motion.button>
            ))}
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("demand.descPlaceholder")}
          rows={2}
          style={{
            padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${colors.borderLight}`,
            background: colors.inputBg, color: colors.text,
            fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical",
          }}
        />

        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder={t("demand.certPlaceholder")}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${colors.borderLight}`,
                background: colors.inputBg, color: colors.text,
                fontSize: 12, outline: "none", fontFamily: "inherit",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && certInput.trim()) {
                  setCerts([...certs, certInput.trim()]);
                  setCertInput("");
                }
              }}
            />
            <motion.button
              onClick={() => { if (certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: "8px 10px", borderRadius: 8, border: "none",
                background: colors.accent, color: "#fff", cursor: "pointer",
                display: "flex", fontFamily: "inherit",
              }}
            >
              <Plus size={14} weight="bold" />
            </motion.button>
          </div>
          {certs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {certs.map((c, i) => (
                <span key={i} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 6px 3px 8px", borderRadius: 6,
                  background: `${colors.accent}10`, fontSize: 10, fontWeight: 500, color: colors.text,
                }}>
                  {c}
                  <button onClick={() => setCerts(certs.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 0, display: "flex" }}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: 11, color: colors.error, margin: 0 }}>{error}</p>}

        <motion.button
          onClick={handleSubmit}
          disabled={submitting || !crop || !volumeKg || !maxPriceFcfa}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "12px 20px", borderRadius: 12, border: "none",
            background: !crop || !volumeKg || !maxPriceFcfa ? colors.surfaceHover : "linear-gradient(135deg, #059669, #10b981)",
            color: !crop || !volumeKg || !maxPriceFcfa ? colors.textMuted : "#fff",
            fontSize: 14, fontWeight: 600, cursor: !crop || !volumeKg || !maxPriceFcfa ? "not-allowed" : "pointer",
            fontFamily: "inherit", marginTop: 4,
          }}
        >
          {submitting ? <Spinner size={16} /> : <Plus size={16} weight="bold" />}
          {t("demand.submit")}
        </motion.button>
      </div>
    </motion.div>
  );
}

const URGENCY_LABELS: Record<DemandUrgency, string> = {
  immediate: "demand.urgency.immediate",
  this_week: "demand.urgency.thisWeek",
  this_month: "demand.urgency.thisMonth",
  flexible: "demand.urgency.flexible",
};
