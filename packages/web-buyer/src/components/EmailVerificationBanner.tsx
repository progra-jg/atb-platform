import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { EnvelopeSimple, PaperPlaneRight, X, SealCheck } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DISMISS_KEY = "atb_email_verify_dismissed";
const FEATURE_DISABLED = true;

export default function EmailVerificationBanner() {
  if (FEATURE_DISABLED) return null;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (dismissed || !user) return null;

  const resendEmail = async () => {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      setSent(true);
    } catch {
      setError(t("auth.verifyError"));
    } finally {
      setSending(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      style={{
        background: `linear-gradient(135deg, ${colors.accent}10, ${colors.info || "#2563eb"}08)`,
        border: `1px solid ${colors.accent}25`,
        borderRadius: 12, padding: "12px 16px",
        marginBottom: 16, position: "relative",
      }}
    >
      <button
        onClick={dismiss}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 24, height: 24, borderRadius: "50%",
          border: "none", background: "transparent",
          color: colors.textMuted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={12} weight="bold" />
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: colors.accentLight, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {sent ? (
            <SealCheck size={16} color={colors.success} weight="fill" />
          ) : (
            <EnvelopeSimple size={16} color={colors.accent} weight="fill" />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 2 }}>
            {t("auth.verifyTitle")}
          </div>
          <div style={{ fontSize: 11.5, color: colors.textMuted, lineHeight: 1.5, marginBottom: 8 }}>
            {sent ? t("auth.verifySent") : t("auth.verifyDesc", { email: user?.email || "" })}
          </div>

          {!sent && (
            <button
              onClick={resendEmail}
              disabled={sending}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                border: "none", background: colors.accentGradient,
                color: "#fff", cursor: sending ? "not-allowed" : "pointer",
                fontSize: 11.5, fontWeight: 600, fontFamily: "inherit",
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? (
                <span style={{
                  width: 12, height: 12, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", animation: "spin 600ms linear infinite",
                }} />
              ) : (
                <PaperPlaneRight size={12} weight="fill" />
              )}
              {t("auth.verifyResend")}
            </button>
          )}

          {error && (
            <div style={{ fontSize: 11, color: colors.error, marginTop: 6 }}>{error}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
