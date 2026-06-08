import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import PasswordInput from "../components/ui/PasswordInput";
import {
  useForm, required, isEmail, matchField,
  hasUpperCase, hasLowerCase, hasDigit, hasSpecial, minLength, pipe,
} from "../hooks/useForm";
import { sanitize, checkRegisterRateLimit } from "../utils/security";
import { Globe, Gift, Check, WarningCircle, Info } from "@phosphor-icons/react";
import { validateReferralCode, applyReferralCode } from "../services/referral";
import { saveReferralBonus } from "../components/ReferralWelcomeBonus";

const FIELD_HINTS: Record<string, { fr: string; en: string }> = {
  company: { fr: "Votre nom d'entreprise permet d'établir la confiance avec les producteurs et d'adapter les recommandations.", en: "Your company name builds trust with producers and helps personalize recommendations." },
  email: { fr: "Votre email sert à la vérification du compte et à l'envoi des notifications d'offres et de transactions.", en: "Your email is used for account verification and transaction notifications." },
  country: { fr: "Votre pays permet d'afficher les lots et prix dans votre région prioritairement.", en: "Your country helps show lots and prices relevant to your region." },
};

const COUNTRY_CODES = ["BJ", "CI", "TG", "BF", "NE", "SN", "ML", "GN", "GH", "NG"];

const ENTRANCE_DELAYS = [80, 120, 160, 200, 260, 320, 380, 440, 500];

export default function Register() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [apiError, setApiError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [acceptedTouched, setAcceptedTouched] = useState(false);
  const [animReady, setAnimReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [referralValid, setReferralValid] = useState<"idle" | "valid" | "invalid" | "checking">(
    searchParams.get("ref") ? "checking" : "idle",
  );

  useEffect(() => {
    requestAnimationFrame(() => setAnimReady(true));
  }, []);

  useEffect(() => {
    if (!referralCode.trim()) {
      setReferralValid("idle");
      return;
    }
    const timer = setTimeout(async () => {
      setReferralValid("checking");
      const ownerId = await validateReferralCode(referralCode);
      setReferralValid(ownerId ? "valid" : "invalid");
    }, 500);
    return () => clearTimeout(timer);
  }, [referralCode]);

  const countries = useMemo(() => COUNTRY_CODES.map(code => ({ code, name: t(`cart.countries.${code}`) })), [t]);

  const { state, bind, handleSubmit, getFieldState } = useForm({
    company: {
      initial: "",
      rules: [required(t("auth.fillAll"))],
    },
    email: {
      initial: "",
      rules: [required(t("auth.fillAll")), isEmail()],
      asyncRules: [],
    },
    password: {
      initial: "",
      rules: [
        required(t("auth.fillAll")),
        minLength(8),
        hasUpperCase(1, t("auth.uppercase")),
        hasLowerCase(1, t("auth.lowercase")),
        hasDigit(1, t("auth.digit")),
        hasSpecial(1, t("auth.special")),
      ],
      piped: pipe([
        minLength(12, t("auth.passwordMinLength")),
        hasUpperCase(1),
        hasLowerCase(1),
        hasDigit(1),
        hasSpecial(1),
      ]),
    },
    confirm: {
      initial: "",
      rules: [required(t("auth.fillAll")), matchField("password", t("auth.password"))],
    },
    country: {
      initial: "BJ",
      rules: [required()],
    },
  });

  const passwordState = getFieldState("password");

  const onSubmit = handleSubmit(async (values: Record<string, string>) => {
    setApiError("");

    setAcceptedTouched(true);
    if (!accepted) return;

    const rateCheck = checkRegisterRateLimit();
    if (!rateCheck.allowed) {
      setApiError(t("auth.error.tooManyAttempts", { seconds: Math.ceil(rateCheck.resetAfterMs / 1000) }));
      return;
    }

    const sanitized = {
      company: sanitize(values.company),
      email: sanitize(values.email).toLowerCase(),
    };

    const err = await register(sanitized.company, sanitized.email, values.password, values.country);
    if (err) { setApiError(t(err)); return; }

    if (referralValid === "valid" && referralCode.trim()) {
      try {
        const result = await applyReferralCode(referralCode.trim(), "");
        if (result.success && result.newUserReward) {
          saveReferralBonus({ amount: Number(result.newUserReward), currency: "XOF" });
        }
      } catch { /* bonus non bloquant */ }
    }

    const redirect = searchParams.get("redirect") || "/onboarding";
    navigate(redirect, { replace: true });
  });

  const toggleLang = () => {
    const l = i18n.language === "fr" ? "en" : "fr";
    i18n.changeLanguage(l);
    localStorage.setItem("lang", l);
  };

  const companyBind = bind("company");
  const emailBind = bind("email");
  const passwordBind = bind("password");
  const confirmBind = bind("confirm");
  const countryBind = bind("country");

  const fadeSlideUp = (delay: number, visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 350ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 350ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 0%, ${colors.accent}15 0%, transparent 60%), ${colors.bg}`,
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-30%", right: "-15%", width: "60%", height: "80%",
        background: `radial-gradient(circle, ${colors.accent}08 0%, transparent 70%)`,
        pointerEvents: "none", animation: animReady ? "rotate 30s linear infinite" : "none",
      }} />

      <button onClick={toggleLang}
        style={{
          position: "absolute", top: 20, right: 24, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 8,
          border: `1px solid ${colors.borderLight}`,
          background: colors.surfaceHover, color: colors.text,
          cursor: "pointer", fontSize: 12, fontWeight: 700,
          letterSpacing: "0.3px", transition: "all 0.15s", fontFamily: "inherit",
          ...fadeSlideUp(40, animReady),
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.surface; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}>
        <Globe size={12} weight="bold" />
        {t(i18n.language === "fr" ? "common.en" : "common.fr")}
      </button>

      <div style={{
        width: "100%", maxWidth: 480,
        background: colors.glassBg, backdropFilter: colors.glassBlur,
        WebkitBackdropFilter: colors.glassBlur,
        borderRadius: 20, border: `1px solid ${colors.glassBorder}`,
        boxShadow: `${colors.shadowXl}, ${colors.accentGlow}`,
        padding: "40px 32px",
        ...fadeSlideUp(20, animReady),
      }}>
        <div style={{ textAlign: "center", marginBottom: 28, ...fadeSlideUp(ENTRANCE_DELAYS[0], animReady) }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo size={48} showText={false} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
            {t("auth.createAccount")}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.textMuted }}>
            {t("auth.registerSubtitle")}
          </p>
        </div>

        <form ref={formRef} onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={fadeSlideUp(ENTRANCE_DELAYS[1], animReady)}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: colors.textSecondary }}>{t("auth.company")}</label>
              <HintTooltip field="company" t={t} i18n={i18n} />
            </div>
            <input
              name="company"
              placeholder={t("auth.company")}
              {...companyBind}
              style={inputStyle(companyBind.error && companyBind.touched ? colors.error : colors.borderLight, colors)}
            />
          </div>

          <div style={fadeSlideUp(ENTRANCE_DELAYS[2], animReady)}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: colors.textSecondary }}>{t("auth.email")}</label>
              <HintTooltip field="email" t={t} i18n={i18n} />
            </div>
            <input
              name="email"
              type="email"
              placeholder={t("auth.email")}
              autoComplete="email"
              {...emailBind}
              style={inputStyle(emailBind.error && emailBind.touched ? colors.error : colors.borderLight, colors)}
            />
          </div>

          <div style={fadeSlideUp(ENTRANCE_DELAYS[3], animReady)}>
            <PasswordInput
              label={t("auth.password")}
              value={passwordBind.value}
              onChange={passwordBind.onChange}
              onBlur={passwordBind.onBlur}
              error={passwordBind.touched ? passwordBind.error : null}
              showRules
              showStrengthMeter
              autoComplete="new-password"
            />
          </div>

          <div style={fadeSlideUp(ENTRANCE_DELAYS[4], animReady)}>
            <input
              name="confirm"
              type="password"
              placeholder={t("auth.confirmPassword")}
              autoComplete="new-password"
              {...confirmBind}
              style={{
                ...inputStyle(confirmBind.error && confirmBind.touched ? colors.error : colors.borderLight, colors),
                fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
              }}
            />
          </div>

          <div style={fadeSlideUp(ENTRANCE_DELAYS[5], animReady)}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: colors.textSecondary }}>{t("auth.country")}</label>
              <HintTooltip field="country" t={t} i18n={i18n} />
            </div>
            <select value={countryBind.value} onChange={countryBind.onChange}
              style={{
                ...inputStyle(countryBind.error && countryBind.touched ? colors.error : colors.borderLight, colors),
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
                fontFamily: "inherit",
              }}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={fadeSlideUp(ENTRANCE_DELAYS[5] + 30, animReady)}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 12px 4px 14px", borderRadius: 12,
              border: `1.5px solid ${
                referralValid === "valid" ? colors.success
                : referralValid === "invalid" ? colors.error
                : colors.borderLight
              }`,
              background: colors.inputBg,
              transition: "border-color 200ms ease",
            }}>
              <Gift size={16} color={
                referralValid === "valid" ? colors.success
                : referralValid === "invalid" ? colors.error
                : colors.textMuted
              } />
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder={t("referral.registerPlaceholder")}
                style={{
                  flex: 1, border: "none", background: "transparent",
                  padding: "10px 0", fontSize: 13, color: colors.text,
                  outline: "none", fontFamily: "inherit",
                  fontVariant: referralCode ? "all-small-caps" : "normal",
                  letterSpacing: referralCode ? "0.1em" : "normal",
                }}
              />
              <AnimatePresence mode="wait">
                {referralValid === "checking" && (
                  <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid transparent",
                      borderTopColor: colors.accent,
                      animation: "spin 600ms linear infinite",
                    }} />
                  </motion.div>
                )}
                {referralValid === "valid" && (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check size={16} color={colors.success} weight="bold" />
                  </motion.div>
                )}
                {referralValid === "invalid" && (
                  <motion.div key="warn" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <WarningCircle size={16} color={colors.error} weight="fill" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {referralCode && referralValid === "idle" && (
              <div style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 4, paddingLeft: 4 }}>
                {t("referral.registerHint")}
              </div>
            )}
            {referralValid === "invalid" && (
              <div style={{ fontSize: 10.5, color: colors.error, marginTop: 4, paddingLeft: 4 }}>
                {t("referral.registerInvalid")}
              </div>
            )}
          </div>

          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            ...fadeSlideUp(ENTRANCE_DELAYS[6], animReady),
          }}>
            <input type="checkbox" id="accept-terms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              onBlur={() => setAcceptedTouched(true)}
              style={{ marginTop: 3, accentColor: colors.accent, width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="accept-terms" style={{
              fontSize: 12, color: colors.textMuted, cursor: "pointer", lineHeight: 1.4,
            }}>
              {t("auth.acceptTerms")}
            </label>
          </div>
          {acceptedTouched && !accepted && (
            <div style={{
              fontSize: 11, color: colors.error, marginTop: -8,
              animation: "fadeSlideUp 150ms ease both",
            }}>
              {t("auth.acceptTermsRequired")}
            </div>
          )}

          {apiError && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: `${colors.error}15`, color: colors.error,
              fontSize: 12, fontWeight: 500,
              animation: "fadeSlideUp 150ms ease both",
            }}>
              {apiError}
            </div>
          )}

          <button type="submit" disabled={state.isSubmitting}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12,
              border: "none", cursor: state.isSubmitting ? "not-allowed" : "pointer",
              background: state.isSubmitting ? colors.surface : colors.accentGradient,
              color: "white",
              fontSize: 15, fontWeight: 700, letterSpacing: "0.3px",
              opacity: state.isSubmitting ? 0.6 : 1,
              transition: "opacity 0.15s, transform 0.1s, background 0.2s",
              marginTop: 4, fontFamily: "inherit",
              position: "relative",
              ...fadeSlideUp(ENTRANCE_DELAYS[7], animReady),
            }}
            onMouseEnter={(e) => { if (!state.isSubmitting) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            {state.isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  animation: "spin 600ms linear infinite",
                  display: "inline-block",
                }} />
                {t("common.loading")}
              </span>
            ) : t("auth.register")}
          </button>
        </form>

        <div style={{
          textAlign: "center", marginTop: 24, fontSize: 13, color: colors.textMuted,
          ...fadeSlideUp(ENTRANCE_DELAYS[8], animReady),
        }}>
          {t("auth.hasAccount")}{" "}
          <Link to="/login" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>
            {t("auth.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function inputStyle(borderColor: string, colors: any): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    border: `1.5px solid ${borderColor}`,
    background: colors.inputBg, color: colors.text, fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease",
  };
}

function HintTooltip({ field, t, i18n }: { field: string; t: (k: string) => string; i18n: any }) {
  const [show, setShow] = useState(false);
  const hint = FIELD_HINTS[field];
  if (!hint) return null;
  const text = i18n.language === "fr" ? hint.fr : hint.en;
  return (
    <div style={{ position: "relative", display: "inline-flex", verticalAlign: "middle", marginLeft: 6 }}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: "pointer", display: "flex", color: "var(--text-muted, #999)", position: "relative" }}
      >
        <Info size={13} weight="bold" />
      </div>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
          background: "#1a1a2e", color: "#fff", fontSize: 11, lineHeight: 1.5,
          padding: "8px 12px", borderRadius: 8, whiteSpace: "normal",
          width: 240, zIndex: 1000, textAlign: "left",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}>
          {text}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            border: "6px solid transparent", borderTopColor: "#1a1a2e",
          }} />
        </div>
      )}
    </div>
  );
}
