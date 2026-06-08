import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Compass } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <FadeIn>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <Compass size={64} style={{ opacity: 0.15, marginBottom: 16, color: colors.textMuted }} />
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            margin: 0,
            color: colors.text,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: 16,
            color: colors.textMuted,
            margin: "12px 0 28px",
            maxWidth: 400,
          }}
        >
          {t("notFound.message")}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              color: "white",
              border: "none",
              padding: "12px 28px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(10,110,74,0.2)",
            }}
          >
            {t("nav.dashboard")}
          </button>
          <button
            onClick={() => navigate("/lots")}
            style={{
              background: colors.surface,
              color: colors.text,
              border: `1.5px solid ${colors.borderLight}`,
              padding: "12px 28px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: colors.shadowSm,
            }}
          >
            {t("notFound.viewLots")}
          </button>
        </div>
      </div>
    </FadeIn>
  );
}

export default NotFound;
