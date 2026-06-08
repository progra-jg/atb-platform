import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { joinCooperative, getCooperativeByInvite } from "../services/cooperative";
import type { Cooperative } from "../types/cooperative";
import { UserPlus, Check, X, MapPin, Users, ArrowRight, Spinner } from "@phosphor-icons/react";

interface CooperativeJoinFormProps {
  inviteCode?: string;
  onJoined?: (coop: Cooperative) => void;
  onClose?: () => void;
}

export default function CooperativeJoinForm({ inviteCode, onJoined, onClose }: CooperativeJoinFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [code, setCode] = useState(inviteCode ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setError("");
    try {
      const found = await getCooperativeByInvite(code.trim());
      if (found) {
        setCoop(found);
      } else {
        setError(t("cooperative.inviteNotFound"));
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!coop || !name.trim()) return;
    setJoining(true);
    setError("");
    try {
      await joinCooperative(coop.id, name.trim(), email.trim(), phone.trim());
      setDone(true);
      onJoined?.(coop);
    } catch {
      setError(t("common.error"));
    } finally {
      setJoining(false);
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
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
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("cooperative.joinSuccess")}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
          {t("cooperative.joinSuccessDesc", { name: coop?.name ?? "" })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
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

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${colors.accent}15`, display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: 12,
      }}>
        <Users size={22} color={colors.accent} weight="fill" />
      </div>
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: colors.text }}>
        {t("cooperative.joinTitle")}
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
        {coop ? t("cooperative.joinFormDesc", { name: coop.name }) : t("cooperative.enterCode")}
      </p>

      {!coop ? (
        <div>
          <div style={{
            display: "flex", gap: 8, marginBottom: 12,
          }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("cooperative.inviteCodePlaceholder")}
              maxLength={7}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: colors.inputBg, color: colors.text,
                fontSize: 14, fontWeight: 600, letterSpacing: "0.1em",
                fontFamily: "monospace", outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <motion.button
              onClick={handleSearch}
              disabled={searching || !code.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: searching ? colors.surfaceHover : colors.accent,
                color: searching ? colors.textMuted : "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {searching ? <Spinner size={16} /> : t("cooperative.search")}
            </motion.button>
          </div>
          {error && <p style={{ fontSize: 11, color: colors.error, margin: "0 0 8px" }}>{error}</p>}
        </div>
      ) : (
        <div>
          <div style={{
            padding: 12, borderRadius: 12,
            background: colors.surfaceHover, marginBottom: 16,
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: colors.text, marginBottom: 2 }}>
              {coop.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
              <MapPin size={12} /> {coop.region} · {coop.commune}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {coop.memberCount} {t("cooperative.members")} · {coop.mainCrops.join(", ")}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("cooperative.namePlaceholder")}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: colors.inputBg, color: colors.text,
                fontSize: 13, outline: "none", fontFamily: "inherit",
              }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("cooperative.emailPlaceholder")}
              type="email"
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: colors.inputBg, color: colors.text,
                fontSize: 13, outline: "none", fontFamily: "inherit",
              }}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("cooperative.phonePlaceholder")}
              type="tel"
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                background: colors.inputBg, color: colors.text,
                fontSize: 13, outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          {error && <p style={{ fontSize: 11, color: colors.error, margin: "0 0 8px" }}>{error}</p>}

          <motion.button
            onClick={handleJoin}
            disabled={joining || !name.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "12px 20px", borderRadius: 12, border: "none",
              background: joining ? colors.surfaceHover : "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: joining ? colors.textMuted : "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {joining ? <Spinner size={16} /> : <UserPlus size={18} weight="bold" />}
            {t("cooperative.joinButton")}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
