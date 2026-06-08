import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { alphaColor } from "./utils";
import { ease } from "./data";
import { CheckCircle } from "@phosphor-icons/react";

export default function NewsletterSection() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    const val = email.trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
    setStatus("loading");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const resp = await fetch(`${apiUrl}/newsletter/subscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val, lang: i18n.language }),
      });
      if (!resp.ok) throw new Error("Network error");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <footer id="newsletter" style={{
      background: isDark ? "#070b09" : "#0f1411",
      borderTop: `1px solid rgba(255,255,255,0.04)`,
      color: "rgba(255,255,255,0.7)",
    }}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
        }}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            {t("landing.newsletterTitle")}
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 24px" }}>
            {t("landing.newsletterDesc")}
          </p>
          <div style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto", justifyContent: "center" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t("footer.emailPlaceholder")}
              aria-label={t("footer.newsletter")}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 10, border: `1px solid rgba(255,255,255,0.12)`,
                background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13,
                outline: "none", fontFamily: "inherit",
              }} />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={status === "loading"}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                border: "none", background: `linear-gradient(135deg, ${colors.accentDark}, ${colors.accent})`,
                color: "#fff", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
              {status === "loading" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                  {t("common.loading")}
                </span>
              ) : status === "success" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} weight="fill" /> {t("common.done")}
                </span>
              ) : t("footer.subscribe")}
            </motion.button>
          </div>
          <AnimatePresence>
            {status === "error" && (
              <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}
                role="alert" aria-live="polite">
                {t("footer.emailInvalid")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </footer>
  );
}
