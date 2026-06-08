import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { createCooperative, getCooperativesForUser } from "../services/cooperative";
import CooperativeJoinForm from "../components/CooperativeJoinForm";
import CooperativeLeaderboard from "../components/CooperativeLeaderboard";
import CooperativeMemberDensity from "../components/CooperativeMemberDensity";
import type { Cooperative } from "../types/cooperative";
import { REGIONS_BENIN } from "../types/cooperative";
import {
  Users, Plus, Buildings, MapPin, Package, CurrencyCircleDollar,
  Check, X, ArrowRight, Spinner, UserPlus,
} from "@phosphor-icons/react";

const CREATE_STEPS = ["info", "crops", "confirm"];

export default function CooperativePage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState<"browse" | "create" | "join">("browse");
  const [createStep, setCreateStep] = useState(0);
  const [myCoops, setMyCoops] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [created, setCreated] = useState<Cooperative | null>(null);

  const [form, setForm] = useState({
    name: "", region: "Atlantique", department: "", commune: "",
    description: "", crops: [] as string[],
  });
  const [cropInput, setCropInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const coops = await getCooperativesForUser(user.id);
      if (mounted) { setMyCoops(coops); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [user]);

  const handleCreate = async () => {
    if (!form.name.trim() || form.crops.length === 0 || !user?.id) return;
    setCreating(true);
    setError("");
    try {
      const coop = await createCooperative(
        form.name.trim(), form.region, form.department, form.commune,
        form.description, user.id, user.company || user.email || "Membre",
        form.crops,
      );
      setCreated(coop);
      setStep("browse");
    } catch {
      setError(t("common.error"));
    } finally {
      setCreating(false);
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div variants={headerVariants} initial="hidden" animate="visible" style={{ marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, #2d6a4f, #40916c)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Buildings size={22} color="#fff" weight="fill" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>
              {t("cooperative.pageTitle")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("cooperative.pageDesc")}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            onClick={() => setStep("create")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10,
              border: "none",
              background: step === "create" ? colors.accent : colors.surfaceHover,
              color: step === "create" ? "#fff" : colors.text,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Plus size={14} weight="bold" />
            {t("cooperative.create")}
          </motion.button>
          <motion.button
            onClick={() => setStep("join")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10,
              border: "none",
              background: step === "join" ? colors.accent : colors.surfaceHover,
              color: step === "join" ? "#fff" : colors.text,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <UserPlus size={14} weight="bold" />
            {t("cooperative.join")}
          </motion.button>
        </div>
      </motion.div>

      {step === "create" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: colors.surface, borderRadius: 20,
            border: `1px solid ${colors.borderLight}`,
            padding: 24, marginBottom: 24,
          }}
        >
          {/* Steps indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {CREATE_STEPS.map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= createStep ? colors.accent : colors.borderLight,
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {/* Step content */}
          {createStep === 0 && (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: colors.text }}>
                {t("cooperative.createInfo")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("cooperative.namePlaceholder")}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.inputBg, color: colors.text,
                    fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${colors.borderLight}`,
                      background: colors.inputBg, color: colors.text,
                      fontSize: 13, outline: "none", fontFamily: "inherit",
                    }}
                  >
                    {REGIONS_BENIN.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    value={form.commune}
                    onChange={(e) => setForm({ ...form, commune: e.target.value })}
                    placeholder={t("cooperative.communePlaceholder")}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${colors.borderLight}`,
                      background: colors.inputBg, color: colors.text,
                      fontSize: 13, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("cooperative.descPlaceholder")}
                  rows={3}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.inputBg, color: colors.text,
                    fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical",
                  }}
                />
              </div>
            </div>
          )}

          {createStep === 1 && (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: colors.text }}>
                {t("cooperative.createCrops")}
              </h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  placeholder={t("cooperative.cropPlaceholder")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.inputBg, color: colors.text,
                    fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && cropInput.trim()) {
                      setForm({ ...form, crops: [...form.crops, cropInput.trim()] });
                      setCropInput("");
                    }
                  }}
                />
                <motion.button
                  onClick={() => {
                    if (cropInput.trim()) {
                      setForm({ ...form, crops: [...form.crops, cropInput.trim()] });
                      setCropInput("");
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "10px 14px", borderRadius: 10, border: "none",
                    background: colors.accent, color: "#fff",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <Plus size={16} weight="bold" />
                </motion.button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {form.crops.map((crop, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px 4px 10px", borderRadius: 8,
                    background: `${colors.accent}12`, fontSize: 11, fontWeight: 500,
                    color: colors.text,
                  }}>
                    {crop}
                    <button onClick={() => setForm({ ...form, crops: form.crops.filter((_, j) => j !== i) })}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: colors.textMuted, padding: 0, display: "flex",
                      }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {form.crops.length === 0 && (
                <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                  {t("cooperative.cropsHint")}
                </p>
              )}
            </div>
          )}

          {createStep === 2 && (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: colors.text }}>
                {t("cooperative.createConfirm")}
              </h3>
              <div style={{
                padding: 16, borderRadius: 12, background: colors.surfaceHover, marginBottom: 16,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{form.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
                  <MapPin size={12} /> {form.region} · {form.commune || t("cooperative.noCommune")}
                </div>
                {form.description && (
                  <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{form.description}</div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {form.crops.map((c, i) => (
                    <span key={i} style={{
                      padding: "2px 8px", borderRadius: 6,
                      background: `${colors.accent}12`,
                      fontSize: 10, fontWeight: 500, color: colors.accent,
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              {error && <p style={{ fontSize: 11, color: colors.error, margin: "0 0 8px" }}>{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <motion.button
              onClick={() => {
                if (createStep > 0) setCreateStep(createStep - 1);
                else setStep("browse");
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "10px 20px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: "transparent", color: colors.text,
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {createStep > 0 ? t("common.back") : t("common.cancel")}
            </motion.button>
            {createStep < 2 ? (
              <motion.button
                onClick={() => {
                  if (createStep === 0 && !form.name.trim()) return;
                  if (createStep === 1 && form.crops.length === 0) return;
                  setCreateStep(createStep + 1);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={createStep === 0 && !form.name.trim() || createStep === 1 && form.crops.length === 0}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: colors.accent, color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  opacity: (createStep === 0 && !form.name.trim() || createStep === 1 && form.crops.length === 0) ? 0.5 : 1,
                }}
              >
                {t("common.next")}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleCreate}
                disabled={creating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {creating ? <Spinner size={14} /> : <Check size={14} weight="bold" />}
                {t("cooperative.confirmCreate")}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {step === "join" && (
        <div style={{ maxWidth: 420, marginBottom: 24 }}>
          <CooperativeJoinForm onJoined={() => setStep("browse")} onClose={() => setStep("browse")} />
        </div>
      )}

      {/* My Cooperatives */}
      {myCoops.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: 24 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 12px" }}>
            {t("cooperative.myCooperatives")}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {myCoops.map((coop) => (
              <div key={coop.id} style={{
                padding: 14, borderRadius: 12,
                background: colors.surface, border: `1px solid ${colors.borderLight}`,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 2 }}>
                  {coop.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>
                  <MapPin size={11} /> {coop.region} · {coop.commune} · {coop.memberCount} {t("cooperative.members")}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: colors.text }}>
                  <span><Package size={12} /> {coop.totalLots}</span>
                  <span><CurrencyCircleDollar size={12} /> {coop.totalRevenueXof.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard + Density */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <CooperativeLeaderboard />
        <CooperativeMemberDensity />
      </div>
    </div>
  );
}
