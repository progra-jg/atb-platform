import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile, useIsSmall } from "../hooks/useMediaQuery";
import { useTranslation } from "react-i18next";
import { Leaf, GithubLogo, LinkedinLogo, TwitterLogo } from "@phosphor-icons/react";
import FooterBackground from "./footer/FooterBackground";
import FooterNewsletter from "./footer/FooterNewsletter";
import FooterLivePanel from "./footer/FooterLivePanel";
import Logo from "./Logo";

const CURRENCY_CODES = ["XOF", "EUR", "USD"];

const NAV_COLUMNS = [
  {
    key: "navigation", titleKey: "footer.navigation", titleFallback: "Navigation",
    items: [
      { labelKey: "footer.search", fallback: "Recherche avancée", to: "/lots" },
      { labelKey: "footer.lots", fallback: "Lots certifiés", to: "/lots" },
      { labelKey: "footer.about", fallback: "Qui sommes-nous ?", to: "/about" },
    ],
  },
  {
    key: "legal", titleKey: "footer.legal", titleFallback: "Légal",
    items: [
      { labelKey: "footer.legalMentions", fallback: "Mentions légales", to: "/legal" },
      { labelKey: "footer.privacy", fallback: "Politique de confidentialité", to: "/privacy" },
      { labelKey: "footer.eudr", fallback: "EUDR Due Diligence", to: "/eudr" },
      { labelKey: "footer.terms", fallback: "CGV", to: "/terms" },
    ],
  },
  {
    key: "support", titleKey: "footer.support", titleFallback: "Support",
    items: [
      { labelKey: "footer.help", fallback: "Centre d'aide", to: "/help" },
      { labelKey: "footer.contact", fallback: "Nous contacter", to: "/contact" },
      { labelKey: "footer.status", fallback: "Statut API", to: "/api-status" },
      { labelKey: "footer.changelog", fallback: "Changelog", to: "/changelog" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: TwitterLogo, href: "https://twitter.com/atb_agri", label: "Twitter" },
  { icon: LinkedinLogo, href: "https://linkedin.com/company/atb", label: "LinkedIn" },
  { icon: GithubLogo, href: "https://github.com/atb-agri", label: "GitHub" },
];

const F: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isSmall = useIsSmall();
  const languages = useMemo(() => [
    { code: "FR", label: t("common.fr") },
    { code: "EN", label: t("common.en") },
  ], [t]);
  const currencies = useMemo(() => [
    { code: "XOF", label: t("footer.xof") },
    { code: "EUR", label: t("footer.eur") },
    { code: "USD", label: t("footer.usd") },
  ], [t]);
  const [lang, setLang] = useState(i18n.language?.toUpperCase() || "FR");
  const [currency, setCurrency] = useState("XOF");
  const [showLang, setShowLang] = useState(false);
  const [showCurr, setShowCurr] = useState(false);
  const [visible, setVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(i18n.language?.toUpperCase() || "FR");
  }, [i18n.language]);

  useEffect(() => {
    const el = footerRef.current;
    if (!el || isSmall) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isSmall]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
      if (currRef.current && !currRef.current.contains(e.target as Node)) setShowCurr(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLangChange = useCallback((code: string) => {
    const lc = code.toLowerCase();
    i18n.changeLanguage(lc);
    localStorage.setItem("lang", lc);
    setLang(code);
    setShowLang(false);
  }, [i18n]);

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12, textDecoration: "none", cursor: "pointer",
    position: "relative", color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)",
    transition: "color 200ms ease", paddingBottom: 1,
  });

  const c = (a: number) => `rgba(255,255,255,${Math.min(a, 1)})`;

  if (isSmall) {
    return (
      <footer style={{
        height: 36, minHeight: 36, background: "#070b09",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 8px", gap: 4, fontSize: 9,
        width: "100%", boxSizing: "border-box",
      }}>
        <span style={{ color: c(0.3), whiteSpace: "nowrap" }}>
          &copy; {new Date().getFullYear()} ATB
        </span>
        <span style={{ color: c(0.12), fontSize: 7 }}>v2.0.0</span>
      </footer>
    );
  }

  const dropdownStyle: React.CSSProperties = {
    position: "absolute", bottom: 22, left: 0,
    background: "#0e1411", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6, minWidth: 100,
    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
    overflow: "hidden", zIndex: 200,
  };

  const btnBase = (): React.CSSProperties => ({
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.055)",
    borderRadius: 4, cursor: "pointer",
    padding: "1px 5px", height: 18,
    color: "rgba(255,255,255,0.45)",
    display: "inline-flex", alignItems: "center", gap: 2,
    fontSize: 8, fontWeight: 700, letterSpacing: "0.5px",
    transition: "all 150ms ease", fontFamily: "inherit",
  });

  return (
    <footer ref={footerRef}
      style={{
        background: "#070b09",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        width: "100%", boxSizing: "border-box",
        position: "relative", zIndex: 10, overflow: "hidden",
      }}>
      <FooterBackground />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: isMobile ? "24px 16px 20px" : "36px 32px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2.2fr 1fr 1fr 1.4fr",
          gap: isMobile ? 28 : 40,
          marginBottom: isMobile ? 24 : 32,
          ...fadeStyle(60),
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Logo size={36} showText />
            </div>
            <p style={{ fontSize: 12, color: c(0.45), lineHeight: 1.8, maxWidth: 340, margin: "0 0 16px" }}>
              {t("footer.description")}
            </p>
            <FooterNewsletter />
          </div>

          {NAV_COLUMNS.map((col, ci) => (
            <div key={col.key} style={fadeStyle(100 + ci * 40)}>
              <h4 style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.8px",
                color: c(0.5), margin: "0 0 14px",
              }}>
                {t(col.titleKey, col.titleFallback)}
              </h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
                {col.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <li key={item.to}>
                      <Link to={item.to}
                        style={linkStyle(active)}
                        onMouseEnter={(e) => { e.currentTarget.style.color = c(0.75); }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = c(0.4); }}>
                        {item.labelKey ? t(item.labelKey, item.fallback) : item.fallback}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          marginBottom: 16,
        }} />

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, fontSize: 10,
          ...fadeStyle(320),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: c(0.25) }}>
              &copy; {new Date().getFullYear()}
              <span style={{ fontWeight: 600, color: c(0.35), marginLeft: 4 }}>ATB AgriTrace</span>
            </span>
            <span style={{ color: c(0.08) }}>|</span>
            <span style={{ color: c(0.2), fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>v2.0.0</span>
          </div>

          <FooterLivePanel />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {SOCIAL_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <a key={s.label} href={s.href}
                  target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.055)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.35)",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(52,211,153,0.1)"; e.currentTarget.style.color = "#34d399"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.035)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.055)"; }}>
                  <Icon size={12} />
                </a>
              );
            })}

            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.06)", margin: "0 4px", flexShrink: 0 }} />

            <div ref={langRef} style={{ position: "relative" }}>
              <button onClick={() => setShowLang(!showLang)}
                aria-label={t("footer.language")}
                style={btnBase()}>
                {lang}
              </button>
              {showLang && (
                <div style={dropdownStyle}>
                  {languages.map((l) => (
                    <div key={l.code} onClick={() => handleLangChange(l.code)}
                      role="menuitem"
                      style={{
                        padding: "5px 10px", cursor: "pointer",
                        color: lang === l.code ? "#22c55e" : "rgba(255,255,255,0.6)",
                        background: lang === l.code ? "rgba(34,197,94,0.06)" : "transparent",
                        fontSize: 10, transition: "background 0.1s",
                      }}>
                      {l.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isMobile && (
              <div ref={currRef} style={{ position: "relative" }}>
                <button onClick={() => setShowCurr(!showCurr)}
                  aria-label={t("footer.currency")}
                  style={btnBase()}>
                  {currency}
                </button>
                {showCurr && (
                  <div style={dropdownStyle}>
                    {currencies.map((c) => (
                      <div key={c.code} onClick={() => { setCurrency(c.code); setShowCurr(false); }}
                        role="menuitem"
                        style={{
                          padding: "5px 10px", cursor: "pointer",
                          color: currency === c.code ? "#22c55e" : "rgba(255,255,255,0.6)",
                          background: currency === c.code ? "rgba(34,197,94,0.06)" : "transparent",
                          fontSize: 10, transition: "background 0.1s",
                        }}>
                        {c.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default F;
