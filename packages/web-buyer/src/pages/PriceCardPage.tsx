import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import SharePricePreview from "../components/SharePricePreview";
import { parseShareUrl } from "../services/whatsappBridge";
import { recordShareClick } from "../services/referralV2";
import { ArrowRight, UserPlus, ArrowArcLeft, Plant } from "@phosphor-icons/react";

export default function PriceCardPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [parsed, setParsed] = useState<ReturnType<typeof parseShareUrl>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = parseShareUrl(searchParams.toString());
    setParsed(result);
    setLoading(false);

    if (result?.refCode) {
      try {
        localStorage.setItem("atb_ref_code", result.refCode);
        const FROM_KEY = "atb_ref_crop";
        localStorage.setItem(FROM_KEY, result.crop);
      } catch { /* noop */ }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!parsed) return;
    const timer = setTimeout(async () => {
      try {
        const shares = JSON.parse(localStorage.getItem("atb_shares_anonymous") ?? "[]");
        const share = shares.find((s: { refCode: string }) => s.refCode === parsed?.refCode);
        if (share) await recordShareClick(share.id);
      } catch { /* noop */ }
    }, 2000);
    return () => clearTimeout(timer);
  }, [parsed]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: colors.bg,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{ width: 32, height: 32, border: `3px solid ${colors.borderLight}`, borderTopColor: colors.accent, borderRadius: "50%" }}
        />
      </div>
    );
  }

  if (!parsed) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: colors.bg, padding: 24,
      }}>
        <Plant size={48} color={colors.textMuted} />
        <h2 style={{ color: colors.text, fontWeight: 600, fontSize: 18, margin: 0 }}>
          {t("share.invalidLink")}
        </h2>
        <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center", maxWidth: 280 }}>
          {t("share.invalidLinkDesc")}
        </p>
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "10px 24px", borderRadius: 12, border: "none",
            background: colors.accent, color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {t("share.goHome")}
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.surfaceHover} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "40px 20px",
    }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 32, textAlign: "center" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${colors.accent}, #40916c)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          <Plant size={24} color="#fff" weight="fill" />
        </motion.div>
        <h1 style={{
          fontSize: 20, fontWeight: 700, color: colors.text, margin: 0,
          lineHeight: 1.3,
        }}>
          {t("share.priceAlert")}
        </h1>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>
          {t("share.priceAlertDesc")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <SharePricePreview
          crop={parsed.crop}
          price={parsed.price}
          change={parsed.change}
          history={parsed.history.length > 0 ? parsed.history : undefined}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 28, width: "100%", maxWidth: 380 }}
      >
        {user ? (
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 20px", borderRadius: 14,
              border: `1px solid ${colors.accent}`,
              background: "transparent",
              color: colors.accent, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("share.viewFullMarket")}
            <ArrowRight size={18} />
          </motion.button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button
              onClick={() => {
                const ref = localStorage.getItem("atb_ref_code");
                const path = ref ? `/register?ref=${ref}` : "/register";
                navigate(path);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "14px 20px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${colors.accent}, #40916c)`,
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 20px ${colors.accent}33`,
              }}
            >
              <UserPlus size={18} weight="bold" />
              {t("share.joinPlatform")}
            </motion.button>
            <motion.button
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "10px 20px", borderRadius: 12,
                border: `1px solid ${colors.borderLight}`,
                background: "transparent",
                color: colors.textMuted, fontSize: 12, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <ArrowArcLeft size={16} />
              {t("share.browse")}
            </motion.button>
          </div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          marginTop: 40, fontSize: 10, color: colors.textMuted,
          textAlign: "center", maxWidth: 300, lineHeight: 1.4,
        }}
      >
        {t("share.disclaimer")}
      </motion.p>
    </div>
  );
}
