import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PaperPlaneTilt, Check } from "@phosphor-icons/react";

export default function FooterNewsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) { setErrorMsg(t("footer.emailInvalid", "Email invalide")); setState("error"); return; }
    setState("loading");
    await new Promise((r) => setTimeout(r, 800));
    setState("success");
    setEmail("");
    setTimeout(() => setState("idle"), 3000);
  }, [email, isValidEmail, t]);

  return (
    <div>
      <h4 style={{
        fontSize: 12, fontWeight: 600,
        color: "rgba(255,255,255,0.7)",
        margin: "0 0 6px", letterSpacing: "0.3px",
      }}>
        {t("footer.newsletter", "Newsletter")}
      </h4>
      <p style={{
        fontSize: 11, color: "rgba(255,255,255,0.4)",
        margin: "0 0 10px", lineHeight: 1.5,
      }}>
        {t("footer.newsletterDesc", "Recevez les analyses marché et les alertes lots chaque semaine.")}
      </p>

      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
            placeholder={t("footer.emailPlaceholder", "votre@email.com")}
            aria-label={t("footer.newsletter", "Newsletter")}
            disabled={state === "loading" || state === "success"}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 11,
              border: `1px solid ${state === "error" ? "#f87171" : "rgba(255,255,255,0.1)"}`,
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.85)",
              outline: "none", fontFamily: "inherit",
              transition: "border-color 200ms ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#34d399"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = state === "error" ? "#f87171" : "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }} />
          <button type="submit" disabled={state === "loading" || state === "success"}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "none",
              background: state === "success" ? "#22c55e" : "linear-gradient(135deg, #064e34, #0a6e4a, #0d8a5a)",
              color: "white", cursor: state === "loading" ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: state === "loading" ? 0.7 : 1,
              transition: "all 200ms ease", minWidth: 32,
            }}
            aria-label={t("footer.subscribe", "S'abonner")}>
            {state === "loading" ? (
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 600ms linear infinite", display: "inline-block" }} />
            ) : state === "success" ? (
              <Check size={14} weight="bold" />
            ) : (
              <PaperPlaneTilt size={14} />
            )}
          </button>
        </div>
        {state === "error" && (
          <p style={{ margin: "4px 0 0", fontSize: 10, color: "#f87171", animation: "fadeSlideUp 150ms ease both" }}>{errorMsg}</p>
        )}
        {state === "success" && (
          <p style={{ margin: "4px 0 0", fontSize: 10, color: "#22c55e", animation: "fadeSlideUp 150ms ease both" }}>
            {t("footer.newsletterSuccess", "Merci ! Vous êtes inscrit.")}
          </p>
        )}
      </form>
    </div>
  );
}
