import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../components/Logo";
import { Input } from "../components/ui/Input";
import { useForm, required, isEmail } from "../hooks/useForm";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Box } from "../components/ui/Box";
import api from "../services/api";

declare global {
  interface GoogleOAuthWindow {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { error?: string; access_token?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const hasGoogleClientId = Boolean(GOOGLE_CLIENT_ID);

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Login() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginToken, verifyTotp, cancelTotp } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleScriptLoaded = useRef(false);

  const handleGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) return;
    setGoogleLoading(true);
    const doLogin = () => {
      try {
        const gis = (window as unknown as GoogleOAuthWindow).google?.accounts?.oauth2;
        if (!gis) { setError(t("auth.googleSignInUnavailable")); setGoogleLoading(false); return; }
        const client = gis.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid profile email",
          callback: async (response: { error?: string; access_token?: string }) => {
            if (response.error) { setError(t("auth.googleSignInCancelled")); setGoogleLoading(false); return; }
            try {
              const res = await api.post("/auth/google", { credential: response.access_token });
              if (res.data.error) { setError(t(res.data.error)); setGoogleLoading(false); return; }
              localStorage.setItem("atb_token", res.data.token);
              window.location.href = searchParams.get("redirect") || "/dashboard";
            } catch { setError(t("auth.error.serverConnection")); setGoogleLoading(false); }
          },
        });
        client.requestAccessToken();
      } catch { setError(t("auth.googleSignInError")); setGoogleLoading(false); }
    };
    if ((window as unknown as GoogleOAuthWindow).google?.accounts?.oauth2) {
      doLogin();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = () => { googleScriptLoaded.current = true; doLogin(); };
      s.onerror = () => { setError(t("auth.googleSignInLoadError")); setGoogleLoading(false); };
      document.body.appendChild(s);
    }
  }, [t, searchParams, setError, setGoogleLoading]);

  const form = useForm({
    email: { initial: "", rules: [required(), isEmail()] },
    password: { initial: "", rules: [required()] },
  });

  const emailField = form.bind("email");
  const passwordField = form.bind("password");

  const onSubmit = form.handleSubmit(async (values) => {
    setError("");
    const err = await login(values.email as string, values.password as string);
    if (err === "totp_required") return;
    if (err) { setError(t(err)); return; }
    navigate(searchParams.get("redirect") || "/dashboard", { replace: true });
  });

  const handleTotp = useCallback(async () => {
    if (totpCode.length < 6) return;
    setTotpError("");
    setTotpLoading(true);
    const err = await verifyTotp(totpCode);
    setTotpLoading(false);
    if (err) { setTotpError(t(err)); return; }
    navigate(searchParams.get("redirect") || "/dashboard", { replace: true });
  }, [totpCode, verifyTotp, navigate, searchParams]);

  const renderLoginForm = () => (
    <>
      <Box sx={{ textAlign: "center", marginBottom: 32 }}>
        <Box display="flex" justifyContent="center" sx={{ marginBottom: 18, animation: "fadeSlideUp 400ms ease 80ms both" }}>
          <Logo size={48} showText={false} />
        </Box>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text, letterSpacing: "-0.02em", animation: "fadeSlideUp 400ms ease 120ms both" }}>
          {t("auth.welcome")}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.textMuted, animation: "fadeSlideUp 400ms ease 160ms both" }}>
          {t("auth.loginSubtitle")}
        </p>
      </Box>

      <form onSubmit={onSubmit} style={{ animation: "fadeSlideUp 400ms ease 200ms both" }}>
        <Box display="flex" flexDirection="column" gap={16}>
          <Input
            label={t("auth.email")}
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            autoComplete="email"
            autoFocus
            value={emailField.value}
            onChange={emailField.onChange}
            onBlur={emailField.onBlur}
            error={emailField.error && emailField.touched ? emailField.error : null}
          />
          <Input
            label={t("auth.password")}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            showPasswordToggle
            showPassword={showPwd}
            onTogglePassword={() => setShowPwd(!showPwd)}
            value={passwordField.value}
            onChange={passwordField.onChange}
            onBlur={passwordField.onBlur}
            error={passwordField.error && passwordField.touched ? passwordField.error : null}
          />
        </Box>

        {error && (
          <Box sx={{
            padding: "10px 14px", borderRadius: 10, marginTop: 8,
            background: `${colors.error}15`, color: colors.error,
            fontSize: 12, fontWeight: 500,
            animation: "fadeSlideUp 200ms ease both",
          }} role="alert">
            {error}
          </Box>
        )}

        <button
          type="submit"
          disabled={form.state.isSubmitting}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, marginTop: 16,
            border: "none", cursor: form.state.isSubmitting ? "not-allowed" : "pointer",
            background: colors.accentGradient, color: "white", fontFamily: "inherit",
            fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
            opacity: form.state.isSubmitting ? 0.6 : 1,
            transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            position: "relative", overflow: "hidden",
          }}
          onMouseEnter={(e) => { if (!form.state.isSubmitting) e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {form.state.isSubmitting ? (
            <span style={{
              display: "inline-block", width: 18, height: 18, borderRadius: "50%",
              border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
              animation: "spin 600ms linear infinite", verticalAlign: "middle",
            }} />
          ) : t("auth.login")}
        </button>
      </form>

      {hasGoogleClientId && (
        <>
      <Box display="flex" alignItems="center" gap={14} sx={{ marginTop: 24, animation: "fadeSlideUp 400ms ease 280ms both" }}>
        <Box flex={1} sx={{ height: 1, background: "currentColor", opacity: 0.1 }} />
        <span style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", opacity: 0.4 }}>{t("auth.orContinueWith")}</span>
        <Box flex={1} sx={{ height: 1, background: "currentColor", opacity: 0.1 }} />
      </Box>

      <button
        type="button"
        disabled={googleLoading}
        onClick={() => handleGoogleLogin()}
        style={{
          width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 12, fontFamily: "inherit",
          border: `1.5px solid ${colors.borderLight}`, fontSize: 13, fontWeight: 600,
          cursor: googleLoading ? "not-allowed" : "pointer", transition: "all 200ms ease",
          background: colors.surfaceHover, color: colors.text,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          opacity: googleLoading ? 0.5 : 1,
          animation: "fadeSlideUp 400ms ease 320ms both",
        }}
        onMouseEnter={(e) => { if (!googleLoading) { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = colors.surface; } }}
        onMouseLeave={(e) => { if (!googleLoading) { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.surfaceHover; } }}
      >
        {googleLoading ? (
          <span style={{
            display: "inline-block", width: 16, height: 16, borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.15)", borderTopColor: colors.accent,
            animation: "spin 600ms linear infinite",
          }} />
        ) : GOOGLE_ICON}
        {t("auth.googleLogin")}
      </button>
        </>
      )}

      <Box sx={{ textAlign: "center", marginTop: 24, fontSize: 13, color: colors.textMuted, animation: "fadeSlideUp 400ms ease 360ms both" }}>
        {t("auth.noAccount")}{" "}
        <Link to="/register" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>
          {t("auth.createAccount")}
        </Link>
      </Box>
    </>
  );

  const renderTotpStep = () => (
    <motion.div
      key="totp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Box sx={{ textAlign: "center", marginBottom: 28 }}>
        <Box display="flex" justifyContent="center" sx={{ marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
            border: `1px solid ${colors.accent}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>
            🔐
          </div>
        </Box>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text, letterSpacing: "-0.02em" }}>
          {t("auth.totpTitle")}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.textMuted }}>
          {t("auth.totpSubtitle")}
        </p>
      </Box>

      <div style={{ textAlign: "center" }}>
        <input
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder={t("auth.totpPlaceholder")}
          autoFocus
          inputMode="numeric"
          style={{
            width: 200, padding: "14px 16px", borderRadius: 12,
            border: `2px solid ${totpError ? colors.error : colors.borderLight}`,
            background: colors.inputBg, fontSize: 24, color: colors.text,
            textAlign: "center", fontFamily: "'SF Mono', 'Fira Code', monospace",
            letterSpacing: "8px", outline: "none",
            transition: "border-color 0.2s ease",
          }}
        />

        {totpError && (
          <Box sx={{
            padding: "10px 14px", borderRadius: 10, marginTop: 12,
            background: `${colors.error}15`, color: colors.error,
            fontSize: 12, fontWeight: 500,
          }} role="alert">
            {totpError}
          </Box>
        )}

        <button
          onClick={handleTotp}
          disabled={totpCode.length < 6 || totpLoading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, marginTop: 16,
            border: "none", cursor: (totpCode.length < 6 || totpLoading) ? "not-allowed" : "pointer",
            background: colors.accentGradient, color: "white", fontFamily: "inherit",
            fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
            opacity: (totpCode.length < 6 || totpLoading) ? 0.6 : 1,
            transition: "all 200ms ease",
          }}
        >
          {totpLoading ? (
            <span style={{
              display: "inline-block", width: 18, height: 18, borderRadius: "50%",
              border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
              animation: "spin 600ms linear infinite", verticalAlign: "middle",
            }} />
          ) : t("auth.verify")}
        </button>

        <button
          onClick={cancelTotp}
          style={{
            width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 12,
            border: `1.5px solid ${colors.borderLight}`, fontFamily: "inherit",
            background: "transparent", color: colors.textSecondary, fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          {t("common.back")}
        </button>
      </div>
    </motion.div>
  );

  return (
    <Box pos="relative" style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 50% 0%, ${colors.accent}15 0%, transparent 60%), ${colors.bg}` }}>
      <Box pos="absolute" top={20} right={24} z={1}>
        <button
          onClick={() => { const l = i18n.language === "fr" ? "en" : "fr"; i18n.changeLanguage(l); localStorage.setItem("lang", l); }}
          style={{
            padding: "5px 12px", borderRadius: 8, fontFamily: "inherit",
            border: `1.5px solid ${colors.borderLight}`, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.03em", cursor: "pointer", transition: "all 200ms ease",
            background: colors.surfaceHover, color: colors.text,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.surface}
          onMouseLeave={(e) => e.currentTarget.style.background = colors.surfaceHover}
        >
          {t(i18n.language === "fr" ? "common.en" : "common.fr")}
        </button>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: "100vh" }}>
        <Box sx={{
          width: "100%", maxWidth: 420, padding: "40px 32px",
          background: colors.glassBg, backdropFilter: colors.glassBlur,
          WebkitBackdropFilter: colors.glassBlur,
          borderRadius: 20, border: `1px solid ${colors.glassBorder}`,
          boxShadow: `${colors.shadowXl}, ${colors.accentGlow}`,
          animation: "fadeSlideUp 400ms ease both",
        }}>
          <AnimatePresence mode="wait">
            {loginToken ? renderTotpStep() : renderLoginForm()}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}
