import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User, Bell, Globe, ShieldCheck, Key, Eye, EyeSlash, Check, Copy, CheckCircle, XCircle, Gift,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import Badge from "../components/Badge";
import ReferralSettingsTab from "../components/ReferralSettingsTab";
import ProfileCompletenessCard from "../components/ProfileCompletenessCard";
import { useIsSmall } from "../hooks/useMediaQuery";
import api from "../services/api";

const TABS = [
  { key: "profil", labelKey: "settings.tabs.profile", icon: User },
  { key: "notifications", labelKey: "settings.tabs.notifications", icon: Bell },
  { key: "region", labelKey: "settings.tabs.region", icon: Globe },
  { key: "securite", labelKey: "settings.tabs.security", icon: ShieldCheck },
  { key: "api", labelKey: "settings.tabs.api", icon: Key },
  { key: "referral", labelKey: "referral.pageTitle", icon: Gift },
];

function Settings() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isSmall = useIsSmall();
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "profil");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({ company: "", email: "", country: "", phone: "", address: "", ifu: "", nom: "", fonction: "", contactEmail: "", contactTel: "" });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem("buyer_notif");
    return saved ? JSON.parse(saved) : [true, true, true, false, false];
  });
  const [region, setRegion] = useState(() => {
    const saved = localStorage.getItem("buyer_region");
    return saved ? JSON.parse(saved) : { langue: localStorage.getItem("lang") || "fr", devise: "XOF", fuseau: "Africa/Porto-Novo", dateFormat: "DD/MM/YYYY" };
  });
  const [security, setSecurity] = useState({ currentPwd: "", newPwd: "", confirmPwd: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [twoFA, setTwoFA] = useState({ step: "idle" as "idle" | "password" | "setup" | "verify", password: "", secret: "", qr: "", code: "", error: "" });
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);

  useEffect(() => {
    if (user) setTotpEnabled(!!user.totpEnabled);
  }, [user]);

  useEffect(() => {
    if (user && !profileLoaded) {
      setProfile({
        company: user.company || "",
        email: user.email || "",
        country: user.country || "",
        phone: user.phone || "",
        address: user.address || "",
        ifu: "",
        nom: "",
        fonction: "",
        contactEmail: user.email || "",
        contactTel: user.phone || "",
      });
      setProfileLoaded(true);
    }
  }, [user, profileLoaded]);

  const copyKey = () => {
    navigator.clipboard.writeText("atb_live_7d8f3a2b1c9e5f4a3b2c").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const metadata = { ifu: profile.ifu, nom: profile.nom, fonction: profile.fonction, contactEmail: profile.contactEmail, contactTel: profile.contactTel };
      const addressStr = profile.address;
      await api.put("/auth/profile", {
        company: profile.company,
        email: profile.email,
        country: profile.country,
        phone: profile.phone,
        address: addressStr,
        metadata,
      });
      await refreshProfile();
      showToast(t("settings.profile.saved"));
    } catch (err: any) {
      showToast(err.response?.data?.error || t("common.error"));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    setPwdError("");
    if (!security.currentPwd || !security.newPwd || !security.confirmPwd) { setPwdError(t("auth.fillAll")); return; }
    if (security.newPwd !== security.confirmPwd) { setPwdError(t("auth.passwordMismatch")); return; }
    if (security.newPwd.length < 8) { setPwdError(t("auth.passwordTooShort")); return; }
    setPwdBusy(true);
    try {
      await api.put("/auth/password", { currentPassword: security.currentPwd, newPassword: security.newPwd });
      setSecurity({ currentPwd: "", newPwd: "", confirmPwd: "" });
      showToast(t("settings.security.pwdUpdated"));
    } catch (err: any) {
      setPwdError(err.response?.data?.error || t("common.error"));
    } finally {
      setPwdBusy(false);
    }
  };

  const handleTotpStart = async () => {
    setTwoFA({ step: "password", password: "", secret: "", qr: "", code: "", error: "" });
  };

  const handleTotpPasswordSubmit = async () => {
    if (!twoFA.password) return;
    setTwoFA(s => ({ ...s, error: "" }));
    setTotpLoading(true);
    try {
      const res = await api.post("/auth/2fa/generate", { password: twoFA.password });
      setTwoFA(s => ({ ...s, step: "setup", secret: res.data.secret, qr: res.data.qrCode }));
    } catch (err: any) {
      setTwoFA(s => ({ ...s, error: err.response?.data?.error || t("auth.totpIncorrectPassword") }));
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpEnable = async () => {
    if (twoFA.code.length < 6) return;
    setTwoFA(s => ({ ...s, error: "" }));
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/enable", { code: twoFA.code });
      setTotpEnabled(true);
      setTwoFA({ step: "idle", password: "", secret: "", qr: "", code: "", error: "" });
      showToast(t("auth.totpEnabled"));
    } catch (err: any) {
      setTwoFA(s => ({ ...s, error: err.response?.data?.error || t("auth.totpInvalidCode") }));
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpDisable = async () => {
    if (!twoFA.password) return;
    setTwoFA(s => ({ ...s, error: "" }));
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password: twoFA.password });
      setTotpEnabled(false);
      setTwoFA({ step: "idle", password: "", secret: "", qr: "", code: "", error: "" });
      showToast(t("auth.totpDisabled"));
    } catch (err: any) {
      setTwoFA(s => ({ ...s, error: err.response?.data?.error || t("auth.totpIncorrectPassword") }));
    } finally {
      setTotpLoading(false);
    }
  };

  const inputStyle = (wide?: boolean) => ({
    width: wide ? "100%" : "50%",
    padding: "10px 14px", borderRadius: 10, fontSize: 13,
    border: `1.5px solid ${colors.borderLight}`, outline: "none",
    background: colors.inputBg, color: colors.text,
    transition: "border-color 0.15s",
  } as React.CSSProperties);

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: colors.textSecondary,
    display: "block", marginBottom: 5,
  } as React.CSSProperties;

  const sectionTitle = {
    fontSize: 16, fontWeight: 600, color: colors.text,
    margin: "0 0 4px",
  } as React.CSSProperties;

  const sectionDesc = {
    fontSize: 12, color: colors.textMuted, margin: "0 0 20px",
  } as React.CSSProperties;

  return (
    <FadeIn>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("nav.settings") },
        ]} />
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0, marginBottom: 6 }}>{t("settings.title")}</h1>
          <p style={{ color: colors.textMuted, fontSize: 15, margin: 0 }}>{t("settings.subtitle")}</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map((tabItem) => {
            const Icon = tabItem.icon;
            const active = tab === tabItem.key;
            return (
              <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{
                display: "flex", alignItems: "center", gap: 7,
                background: active ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.surface,
                color: active ? "white" : colors.text,
                border: active ? "none" : `1.5px solid ${colors.borderLight}`,
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <Icon size={16} weight={active ? "fill" : "regular"} />
                {t(tabItem.labelKey)}
              </button>
            );
          })}
        </div>

        <div style={{
          background: colors.surface, borderRadius: 14,
          border: `1.5px solid ${colors.border}`,
          boxShadow: colors.shadowMd, padding: isSmall ? 20 : 32,
        }}>
          {tab === "profil" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <ProfileCompletenessCard />
              </div>
              <h2 style={sectionTitle}>{t("settings.profile.title")}</h2>
              <p style={sectionDesc}>{t("settings.profile.desc")}</p>
              <div style={{ display: "grid", gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr", gap: "20px 24px", maxWidth: 640 }}>
                <div>
                  <label style={labelStyle}>{t("settings.profile.company")}</label>
                  <input type="text" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.profile.ifu")}</label>
                  <input type="text" value={profile.ifu} onChange={(e) => setProfile({ ...profile, ifu: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.profile.email")}</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.profile.phone")}</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>{t("settings.profile.address")}</label>
                  <input type="text" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
              </div>
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1.5px solid ${colors.border}` }}>
                <h2 style={sectionTitle}>{t("settings.profile.contactTitle")}</h2>
                <p style={sectionDesc}>{t("settings.profile.contactDesc")}</p>
                <div style={{ display: "grid", gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr", gap: "20px 24px", maxWidth: 640 }}>
                  <div>
                    <label style={labelStyle}>{t("settings.profile.name")}</label>
                    <input type="text" value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("settings.profile.function")}</label>
                    <input type="text" value={profile.fonction} onChange={(e) => setProfile({ ...profile, fonction: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("settings.profile.email")}</label>
                    <input type="email" value={profile.contactEmail} onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("settings.profile.phone")}</label>
                    <input type="tel" value={profile.contactTel} onChange={(e) => setProfile({ ...profile, contactTel: e.target.value })} style={inputStyle(true)} onFocus={(e) => e.currentTarget.style.borderColor = colors.accent} onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 28 }}>
                <button onClick={saveProfile} disabled={profileSaving}
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "white", border: "none",
                    padding: "11px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: profileSaving ? "not-allowed" : "pointer", opacity: profileSaving ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}>
                  {profileSaving ? t("common.loading") : t("settings.profile.save")}
                </button>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={sectionTitle}>{t("settings.notifications.title")}</h2>
              <p style={sectionDesc}>{t("settings.notifications.desc")}</p>

              {[
                { key: "newLots", label: t("settings.notifications.newLots"), desc: t("settings.notifications.newLotsDesc") },
                { key: "orderUpdate", label: t("settings.notifications.orderUpdate"), desc: t("settings.notifications.orderUpdateDesc") },
                { key: "certExpiry", label: t("settings.notifications.certExpiry"), desc: t("settings.notifications.certExpiryDesc") },
                { key: "compliance", label: t("settings.notifications.compliance"), desc: t("settings.notifications.complianceDesc") },
                { key: "newsletter", label: t("settings.notifications.newsletter"), desc: t("settings.notifications.newsletterDesc") },
              ].map((item, i) => (
                <div key={item.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 0", borderBottom: `1.5px solid ${colors.border}`,
                  animation: `fadeSlideUp 0.3s ease ${i * 0.04}s both`,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <div onClick={() => {
                    const next = [...notifPrefs];
                    next[i] = !next[i];
                    setNotifPrefs(next);
                  }} style={{
                    width: 42, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0,
                    background: notifPrefs[i] ? colors.success : colors.borderLight,
                    transition: "background 0.2s", position: "relative",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      position: "absolute", top: 3, left: notifPrefs[i] ? 21 : 3,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24 }}>
                <button onClick={() => { localStorage.setItem("buyer_notif", JSON.stringify(notifPrefs)); showToast(t("settings.notifications.saved")); }} style={{
                  background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "white", border: "none",
                  padding: "11px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}>{t("settings.notifications.save")}</button>
              </div>
            </div>
          )}

          {tab === "region" && (
            <div style={{ maxWidth: 480 }}>
              <h2 style={sectionTitle}>{t("settings.region.title")}</h2>
              <p style={sectionDesc}>{t("settings.region.desc")}</p>
              <div style={{ display: "grid", gap: 20 }}>
                <div>
                  <label style={labelStyle}>{t("settings.region.language")}</label>
                  <select value={region.langue} onChange={(e) => { setRegion({ ...region, langue: e.target.value }); localStorage.setItem("lang", e.target.value); i18n.changeLanguage(e.target.value); }} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    border: `1.5px solid ${colors.borderLight}`, outline: "none",
                    background: colors.inputBg, color: colors.text, cursor: "pointer",
                  }}>
                    <option value="fr">{t("settings.region.fr")}</option>
                    <option value="en">{t("settings.region.en")}</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.region.currency")}</label>
                  <select value={region.devise} onChange={(e) => setRegion({ ...region, devise: e.target.value })} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    border: `1.5px solid ${colors.borderLight}`, outline: "none",
                    background: colors.inputBg, color: colors.text, cursor: "pointer",
                  }}>
                    <option value="XOF">F CFA (XOF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar (USD)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.region.timezone")}</label>
                  <select value={region.fuseau} onChange={(e) => setRegion({ ...region, fuseau: e.target.value })} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    border: `1.5px solid ${colors.borderLight}`, outline: "none",
                    background: colors.inputBg, color: colors.text, cursor: "pointer",
                  }}>
                    <option value="Africa/Porto-Novo">Afrique — Porto-Novo (UTC+1)</option>
                    <option value="Europe/Paris">Europe — Paris (UTC+1)</option>
                    <option value="America/New_York">Amérique — New York (UTC-5)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.region.dateFormat")}</label>
                  <select value={region.dateFormat} onChange={(e) => setRegion({ ...region, dateFormat: e.target.value })} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    border: `1.5px solid ${colors.borderLight}`, outline: "none",
                    background: colors.inputBg, color: colors.text, cursor: "pointer",
                  }}>
                    <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                    <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <button onClick={() => { localStorage.setItem("buyer_region", JSON.stringify(region)); showToast(t("settings.region.saved")); }} style={{
                  background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "white", border: "none",
                  padding: "11px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}>{t("settings.region.save")}</button>
              </div>
            </div>
          )}

          {tab === "securite" && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={sectionTitle}>{t("settings.security.password")}</h2>
              <p style={sectionDesc}>{t("settings.security.passwordDesc")}</p>
              <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={labelStyle}>{t("settings.security.currentPwd")}</label>
                  <input type="password" value={security.currentPwd}
                    onChange={(e) => setSecurity({ ...security, currentPwd: e.target.value })}
                    placeholder="••••••••" style={inputStyle(true)}
                    onFocus={(e) => e.currentTarget.style.borderColor = colors.accent}
                    onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.security.newPwd")}</label>
                  <input type="password" value={security.newPwd}
                    onChange={(e) => setSecurity({ ...security, newPwd: e.target.value })}
                    placeholder="Minimum 8 caractères" style={inputStyle(true)}
                    onFocus={(e) => e.currentTarget.style.borderColor = colors.accent}
                    onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
                <div>
                  <label style={labelStyle}>{t("settings.security.confirmPwd")}</label>
                  <input type="password" value={security.confirmPwd}
                    onChange={(e) => setSecurity({ ...security, confirmPwd: e.target.value })}
                    placeholder="••••••••" style={inputStyle(true)}
                    onFocus={(e) => e.currentTarget.style.borderColor = colors.accent}
                    onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                </div>
              </div>

              {pwdError && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 14px", borderRadius: 10,
                  background: `${colors.error}15`, color: colors.error,
                  fontSize: 12, fontWeight: 500, marginBottom: 16,
                }}>
                  <XCircle size={14} weight="fill" />
                  {pwdError}
                </div>
              )}

              <div style={{ marginBottom: 28, padding: 20, background: colors.statBg, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <ShieldCheck size={20} color={totpEnabled ? colors.success : colors.textMuted} weight="fill" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t("settings.security.twoFA")}</span>
                  {totpEnabled && (
                    <Badge text={t("auth.totpEnabled")} variant="success" size="sm" pill={false} />
                  )}
                </div>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 14px 32px" }}>
                  {t("settings.security.twoFADesc")}
                </p>

                {twoFA.step === "idle" && (
                  <div style={{ marginLeft: 32, display: "flex", gap: 8 }}>
                    {!totpEnabled ? (
                      <button onClick={handleTotpStart} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: colors.surface, color: colors.accent,
                        border: `1.5px solid ${colors.borderLight}`,
                        padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = colors.accentLight; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.surface; }}>
                        {t("auth.totpEnableBtn")}
                      </button>
                    ) : (
                      <button onClick={() => setTwoFA({ step: "password", password: "", secret: "", qr: "", code: "", error: "" })} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: colors.surface, color: colors.error,
                        border: `1.5px solid ${colors.error}40`,
                        padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.error; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${colors.error}40`; }}>
                        {t("auth.totpDisableBtn")}
                      </button>
                    )}
                  </div>
                )}

                {twoFA.step === "password" && (
                  <div style={{ marginLeft: 32 }}>
                    <label style={labelStyle}>{t("auth.totpEnterPassword")}</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                      <input type="password" value={twoFA.password}
                        onChange={(e) => setTwoFA(s => ({ ...s, password: e.target.value, error: "" }))}
                        placeholder="••••••••"
                        style={{ width: 220, padding: "10px 14px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${twoFA.error ? colors.error : colors.borderLight}`, outline: "none", background: colors.inputBg, color: colors.text }}
                        onKeyDown={(e) => { if (e.key === "Enter") totpEnabled ? handleTotpDisable() : handleTotpPasswordSubmit(); }} />
                      <button onClick={totpEnabled ? handleTotpDisable : handleTotpPasswordSubmit} disabled={totpLoading || !twoFA.password}
                        style={{
                          padding: "10px 20px", borderRadius: 8, border: "none",
                          background: totpEnabled ? `${colors.error}dd` : colors.accentGradient,
                          color: "#fff", fontWeight: 600, fontSize: 12, cursor: totpLoading ? "not-allowed" : "pointer",
                          opacity: totpLoading ? 0.6 : 1, fontFamily: "inherit",
                        }}>
                        {totpLoading ? t("common.loading") : totpEnabled ? t("auth.totpDisableBtn") : t("common.continue")}
                      </button>
                    </div>
                    {twoFA.error && (
                      <div style={{ fontSize: 11, color: colors.error, marginTop: 6 }}>{twoFA.error}</div>
                    )}
                  </div>
                )}

                {twoFA.step === "setup" && (
                  <div style={{ marginLeft: 32 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{t("auth.totpSetupTitle")}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>{t("auth.totpSetupDesc")}</div>
                      {twoFA.qr && (
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                          <img src={twoFA.qr} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8 }} />
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>{t("auth.totpSetupManual")}</div>
                      <div style={{
                        background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                        borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "monospace",
                        color: colors.text, wordBreak: "break-all", marginBottom: 14,
                      }}>
                        {twoFA.secret}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>{t("auth.totpVerifyDesc")}</label>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <input value={twoFA.code}
                          onChange={(e) => setTwoFA(s => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6), error: "" }))}
                          placeholder="000 000" inputMode="numeric"
                          style={{
                            width: 160, padding: "10px 14px", borderRadius: 8, fontSize: 16,
                            fontFamily: "monospace", letterSpacing: "4px", textAlign: "center",
                            border: `1.5px solid ${twoFA.error ? colors.error : colors.borderLight}`,
                            outline: "none", background: colors.inputBg, color: colors.text,
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleTotpEnable(); }} />
                        <button onClick={handleTotpEnable} disabled={totpLoading || twoFA.code.length < 6}
                          style={{
                            padding: "10px 20px", borderRadius: 8, border: "none",
                            background: colors.accentGradient, color: "#fff",
                            fontWeight: 600, fontSize: 12, cursor: totpLoading ? "not-allowed" : "pointer",
                            opacity: totpLoading || twoFA.code.length < 6 ? 0.6 : 1, fontFamily: "inherit",
                          }}>
                          {totpLoading ? t("common.loading") : t("auth.verify")}
                        </button>
                      </div>
                      {twoFA.error && (
                        <div style={{ fontSize: 11, color: colors.error, marginTop: 6 }}>{twoFA.error}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={changePassword} disabled={pwdBusy}
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "white", border: "none",
                  padding: "11px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: pwdBusy ? "not-allowed" : "pointer", opacity: pwdBusy ? 0.6 : 1,
                }}>
                {pwdBusy ? t("common.loading") : t("settings.security.update")}
              </button>
            </div>
          )}

          {tab === "api" && (
            <div style={{ maxWidth: 640 }}>
              <h2 style={sectionTitle}>{t("settings.api.title")}</h2>
              <p style={sectionDesc}>{t("settings.api.desc")}</p>

              <div style={{
                padding: 18, background: colors.statBg, borderRadius: 12,
                border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowSm, marginBottom: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("settings.api.production")}</div>
                  <Badge text={t("settings.api.active")} variant="success" size="sm" pill={false} />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                  borderRadius: 8, padding: "10px 14px",
                }}>
                  <code style={{
                    flex: 1, fontSize: 12, fontFamily: "monospace",
                    color: showKey ? colors.text : colors.textMuted,
                    letterSpacing: showKey ? "0" : "2px",
                  }}>
                    {showKey ? "atb_live_7d8f3a2b1c9e5f4a3b2c" : "••••••••••••••••••••••••"}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: colors.textMuted, padding: 4, display: "flex",
                  }}>
                    {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={copyKey} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copied ? colors.success : colors.textMuted, padding: 4, display: "flex",
                  }}>
                    {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                  {t("settings.api.created")} 15/03/2024 — {t("settings.api.lastUsed")}: 2 h
                </div>
              </div>

              <div style={{
                padding: 18, background: colors.statBg, borderRadius: 12,
                border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowSm,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("settings.api.test")}</div>
                  <Badge text={t("settings.api.sandbox")} variant="warning" size="sm" pill={false} />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                  borderRadius: 8, padding: "10px 14px",
                }}>
                  <code style={{
                    flex: 1, fontSize: 12, fontFamily: "monospace", color: colors.textMuted,
                  }}>
                    atb_test_a1b2c3d4e5f6g7h8i9j0
                  </code>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                  {t("settings.api.limit")}: 100 req/h — {t("settings.api.expires")} 31/12/2024
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button onClick={() => showToast(t("settings.api.generated"))} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: colors.surface, color: colors.text,
                  border: `1.5px dashed ${colors.borderLight}`,
                  padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.text; }}>
                  + {t("settings.api.generate")}
                </button>
              </div>
            </div>
          )}

          {tab === "referral" && (
            <ReferralSettingsTab />
          )}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, animation: "fadeSlideUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} weight="fill" />
            {toast}
          </div>
        </div>
      )}
    </FadeIn>
  );
}

export default Settings;
