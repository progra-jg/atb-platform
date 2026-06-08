import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { Leaf, Cube, ArrowRight, ShieldCheck, Globe, Users, ChartBar } from "@phosphor-icons/react";
import { formatNumber } from "../utils/format";

const STATS = [
  { key: "countries", icon: Globe, value: 10, suffix: "+" },
  { key: "farmers", icon: Users, value: 2500, suffix: "+" },
  { key: "lots", icon: Cube, value: 5000, suffix: "+" },
  { key: "compliance", icon: ShieldCheck, value: 100, suffix: "%" },
];

const VALUES = [
  { key: "transparency", icon: Cube, color: "#34d399" },
  { key: "trust", icon: ShieldCheck, color: "#60a5fa" },
  { key: "innovation", icon: ChartBar, color: "#a78bfa" },
  { key: "sustainability", icon: Leaf, color: "#22c55e" },
];

const TEAM = [
  { name: "AZONDEKON J. Flavio", initials: "AJ", roleKey: "about.teamFlavioRole", bioKey: "about.teamFlavioBio" },
  { name: "SOUHE Marvine", initials: "SM", roleKey: "about.teamMarvineRole", bioKey: "about.teamMarvineBio" },
];

const MILESTONES = [
  { year: "2021", titleKey: "about.m2021", descKey: "about.m2021Desc" },
  { year: "2022", titleKey: "about.m2022", descKey: "about.m2022Desc" },
  { year: "2023", titleKey: "about.m2023", descKey: "about.m2023Desc" },
  { year: "2024", titleKey: "about.m2024", descKey: "about.m2024Desc" },
  { year: "2025", titleKey: "about.m2025", descKey: "about.m2025Desc" },
  { year: "2026", titleKey: "about.m2026", descKey: "about.m2026Desc" },
];

const PARTNERS = [
  { name: "SGS", desc: "Certification" },
  { name: "GlobalGAP", desc: "Standard" },
  { name: "INRIA", desc: "R&D IA" },
  { name: "Orange", desc: "Mobile Money" },
  { name: "MTN", desc: "MoMo" },
  { name: "Hyperledger", desc: "Blockchain" },
];

export default function About() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisible(true); }, []);

  const fadeUp = (d: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) ${d}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${d}ms`,
  });

  return (
    <div style={{
      background: isDark ? "#070b09" : "#f4f6f5",
      minHeight: "100vh",
      fontFamily: "var(--font-sans)",
    }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", maxWidth: 1280, margin: "0 auto",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accentDark}, ${colors.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={16} weight="fill" color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>ATB</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <Link to="/dashboard" style={{
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              padding: "8px 18px", borderRadius: 8,
              background: colors.accentGradient, color: "white",
            }}>{t("nav.dashboard")}</Link>
          ) : (
            <>
              <Link to="/login" style={{
                fontSize: 13, color: colors.textSecondary, textDecoration: "none",
                fontWeight: 500, transition: "color 150ms ease",
              }}>{t("auth.login")}</Link>
              <Link to="/register" style={{
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                padding: "8px 18px", borderRadius: 8,
                background: colors.accentGradient, color: "white",
              }}>{t("auth.register")}</Link>
            </>
          )}
        </div>
      </nav>

      <div ref={heroRef} style={{ textAlign: "center", padding: isMobile ? "60px 20px" : "100px 24px 60px", maxWidth: 800, margin: "0 auto" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
          color: isDark ? "#34d399" : colors.accentDark,
          marginBottom: 20, letterSpacing: "0.5px",
          ...fadeUp(80),
        }}>
          <Cube size={12} weight="fill" /> B2B AGRITECH PLATFORM
        </span>

        <h1 style={{
          fontSize: isMobile ? 28 : 44, fontWeight: 800,
          lineHeight: 1.15, margin: "0 0 16px",
          background: isDark
            ? "linear-gradient(135deg, #e2e7e4, #34d399)"
            : "linear-gradient(135deg, #0f1318, #0a6e4a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          ...fadeUp(140),
        }}>
          {t("about.heroTitle", "Repenser l'approvisionnement agricole pour l'Afrique de l'Ouest")}
        </h1>

        <p style={{
          fontSize: isMobile ? 14 : 16, lineHeight: 1.7,
          color: colors.textSecondary, maxWidth: 640, margin: "0 auto",
          ...fadeUp(200),
        }}>
          {t("about.heroDesc", "ATB AgriTrace est la première place de marché B2B qui connecte acheteurs internationaux et producteurs ouest-africains. Notre mission : rendre chaque transaction traçable, chaque certification vérifiable et chaque filière durable — grâce à la blockchain, l'IA et la conformité EUDR native.")}
        </p>

        {!user && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28, ...fadeUp(260) }}>
            <Link to="/register" style={{
              padding: "12px 28px", borderRadius: 12,
              background: colors.accentGradient, color: "white",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              {t("about.cta", "Créer un compte")} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 12, maxWidth: 900, margin: "0 auto 80px", padding: "0 20px",
        ...fadeUp(320),
      }}>
        {STATS.map((s) => {
          const Icon = s.icon;
          const [count, setCount] = useState(0);
          const ref = useRef<HTMLDivElement>(null);
          useEffect(() => {
            const el = ref.current;
            if (!el) return;
            const obs = new IntersectionObserver(([e]) => {
              if (!e.isIntersecting) return;
              let start = 0;
              const step = Math.ceil(s.value / 40);
              const iv = setInterval(() => {
                start += step;
                if (start >= s.value) { start = s.value; clearInterval(iv); }
                setCount(start);
              }, 30);
              obs.disconnect();
            }, { threshold: 0.3 });
            obs.observe(el);
            return () => obs.disconnect();
          }, [s.value]);
          return (
            <div key={s.key} ref={ref} style={{
              padding: "20px 16px", borderRadius: 14,
              background: isDark ? "rgba(255,255,255,0.03)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              textAlign: "center", backdropFilter: "blur(8px)",
            }}>
              <Icon size={20} color={colors.accent} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: colors.text, fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(count)}{s.suffix}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {t(`about.stat${s.key.charAt(0).toUpperCase() + s.key.slice(1)}`, s.key)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto 80px", padding: "0 20px", ...fadeUp(380) }}>
        <h2 style={{
          fontSize: isMobile ? 22 : 30, fontWeight: 700,
          textAlign: "center", margin: "0 0 40px", color: colors.text,
        }}>
          {t("about.valuesTitle", "Nos valeurs fondatrices")}
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}>
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.key} style={{
                padding: "24px", borderRadius: 14,
                background: isDark ? "rgba(255,255,255,0.03)" : "white",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${v.color}15`, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={20} color={v.color} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: colors.text }}>
                    {t(`about.value${v.key.charAt(0).toUpperCase() + v.key.slice(1)}`, v.key)}
                  </h3>
                  <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
                    {t(`about.value${v.key.charAt(0).toUpperCase() + v.key.slice(1)}Desc`, "")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        background: isDark ? "rgba(255,255,255,0.02)" : "white",
        padding: isMobile ? "50px 20px" : "70px 24px",
        ...fadeUp(440),
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{
            fontSize: isMobile ? 22 : 30, fontWeight: 700,
            textAlign: "center", margin: "0 0 8px", color: colors.text,
          }}>
            {t("about.timelineTitle", "Notre parcours")}
          </h2>
          <p style={{
            fontSize: 13, color: colors.textMuted, textAlign: "center",
            margin: "0 0 40px",
          }}>
            {t("about.timelineSub", "De l'idée à l'impact régional")}
          </p>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: isMobile ? 8 : "50%", top: 0, bottom: 0,
              width: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              transform: isMobile ? "none" : "translateX(-50%)",
            }} />
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={m.year} style={{
                  display: "flex",
                  flexDirection: isMobile ? "row" : (isLeft ? "row" : "row-reverse"),
                  alignItems: "flex-start", gap: 16,
                  paddingBottom: 28, position: "relative",
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: colors.accent, flexShrink: 0,
                    marginTop: 4,
                    boxShadow: `0 0 0 4px ${isDark ? "rgba(52,211,153,0.15)" : "rgba(10,110,74,0.15)"}`,
                    position: "relative", zIndex: 1,
                    ...(isMobile ? {} : { marginLeft: isLeft ? 0 : 0, marginRight: isLeft ? 0 : 0 }),
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: colors.accent,
                      letterSpacing: "1px",
                    }}>{m.year}</span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 4px", color: colors.text }}>{t(m.titleKey)}</h4>
                    <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>{t(m.descKey)}</p>
                  </div>
                  <div style={{ flex: isMobile ? 0 : 1 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "50px 20px" : "70px 24px", ...fadeUp(500) }}>
        <h2 style={{
          fontSize: isMobile ? 22 : 30, fontWeight: 700,
          textAlign: "center", margin: "0 0 8px", color: colors.text,
        }}>
          {t("about.teamTitle", "Notre équipe dirigeante")}
        </h2>
        <p style={{
          fontSize: 13, color: colors.textMuted, textAlign: "center",
          margin: "0 0 36px",
        }}>
          {t("about.teamSub", "Des experts agriTech, finance et supply chain")}
        </p>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}>
          {TEAM.map((m) => (
            <div key={m.name} style={{
              padding: "20px", borderRadius: 14,
              background: isDark ? "rgba(255,255,255,0.03)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.accentDark}, ${colors.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12, fontSize: 16, fontWeight: 700, color: "white",
              }}>
                {m.initials}
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: colors.text }}>{m.name}</h4>
              <p style={{ fontSize: 11, color: colors.accent, fontWeight: 600, margin: "0 0 8px" }}>{t(m.roleKey)}</p>
              <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>{t(m.bioKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        textAlign: "center", padding: isMobile ? "40px 20px 60px" : "50px 24px 80px",
        ...fadeUp(560),
      }}>
        <div style={{
          maxWidth: 600, margin: "0 auto", padding: "40px 30px", borderRadius: 20,
          background: isDark ? "rgba(255,255,255,0.03)" : "white",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          backdropFilter: "blur(12px)",
        }}>
          <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, margin: "0 0 8px", color: colors.text }}>
            {t("about.ctaTitle", "Prêt à transformer votre approvisionnement ?")}
          </h2>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 20px" }}>
            {t("about.ctaDesc", "Rejoignez les 2500 producteurs et acheteurs qui font confiance à ATB AgriTrace.")}
          </p>
          <Link to={user ? "/dashboard" : "/register"} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 12,
            background: colors.accentGradient, color: "white",
            fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            {user ? t("nav.dashboard") : t("about.cta", "Créer un compte")} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
