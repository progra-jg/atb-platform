import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "../components/PageTransition";
import { StaggerContainer, StaggerItem } from "../components/ui/StaggerContainer";
import {
  MagnifyingGlass, BookBookmark, UserCircle, CreditCard,
  ArrowRight, Cube, ShieldCheck, ChartBar, Clock,
  TrendUp, X, Sparkle,
} from "@phosphor-icons/react";

const CAT_ICONS: Record<string, typeof Cube> = {
  gettingStarted: BookBookmark, lots: Cube, eudr: ShieldCheck,
  payment: CreditCard, account: UserCircle, insights: ChartBar,
};
const CAT_KEYS = ["gettingStarted", "lots", "eudr", "payment", "account", "insights"];
const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"];

const ANALYTICS_KEY = "atb_help_analytics";
const TRENDING_KEY = "atb_help_trending";

function scoreFuzzy(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/);
  let matchCount = 0;
  for (const qw of qWords) {
    if (tWords.some((tw) => tw.startsWith(qw) || tw.includes(qw))) matchCount++;
  }
  if (matchCount === 0) return 0;
  return Math.round((matchCount / qWords.length) * 70);
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = q.split(/\s+/).filter(Boolean);
  let result = text;
  for (const p of parts) {
    result = result.replace(new RegExp(`(${p})`, "gi"), "<mark>$1</mark>");
  }
  return result;
}

function trackSearch(query: string, resultsCount: number) {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const data = raw ? JSON.parse(raw) : { searches: [], noResults: [] };
    data.searches.push({ q: query, t: Date.now(), count: resultsCount });
    if (resultsCount === 0 && query.trim()) {
      data.noResults.push({ q: query, t: Date.now() });
    }
    if (data.searches.length > 200) data.searches = data.searches.slice(-200);
    if (data.noResults.length > 50) data.noResults = data.noResults.slice(-50);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));

    const trendsRaw = localStorage.getItem(TRENDING_KEY);
    const trends = trendsRaw ? JSON.parse(trendsRaw) : {};
    const key = query.trim().toLowerCase();
    if (key) {
      trends[key] = (trends[key] || 0) + 1;
      localStorage.setItem(TRENDING_KEY, JSON.stringify(trends));
    }
  } catch {}
}

function getTrending(): string[] {
  try {
    const raw = localStorage.getItem(TRENDING_KEY);
    if (!raw) return [];
    const trends = JSON.parse(raw);
    return Object.entries(trends)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([k]) => k);
  } catch { return []; }
}

interface SearchResult {
  type: "faq" | "category";
  key: string;
  title: string;
  desc: string;
  score: number;
}

export default function Help() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  const trending = useMemo(() => getTrending(), [search]);

  useEffect(() => setVisible(true), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  const allResults: SearchResult[] = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const results: SearchResult[] = [];

    for (const key of CAT_KEYS) {
      const title = t(`help.cat.${key}`);
      const desc = t(`help.cat.${key}Desc`);
      const s = Math.max(scoreFuzzy(debouncedSearch, title), scoreFuzzy(debouncedSearch, desc));
      if (s > 0) results.push({ type: "category", key, title, desc, score: s });
    }

    for (const k of FAQ_KEYS) {
      const q = t(`help.${k}q`);
      const r = t(`help.${k}r`);
      const s = Math.max(scoreFuzzy(debouncedSearch, q), scoreFuzzy(debouncedSearch, r));
      if (s > 0) results.push({ type: "faq", key: k, title: q, desc: r, score: s });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 12);
  }, [debouncedSearch, t]);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      trackSearch(debouncedSearch, allResults.length);
    }
  }, [debouncedSearch, allResults.length]);

  useEffect(() => {
    setSelectedIdx(-1);
  }, [debouncedSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!allResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      const res = allResults[selectedIdx];
      if (res.type === "faq") {
        setOpenFaq((prev) => prev === res.key ? null : res.key);
      }
    }
  };

  const handleFaqToggle = (key: string) => {
    setOpenFaq((prev) => prev === key ? null : key);
  };

  const fadeUp = (d: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms`,
  });

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: isDark ? "#070b09" : "#f4f6f5" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 100px" }}>
          <div style={{ textAlign: "center", ...fadeUp(0) }}>
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 8,
              background: "linear-gradient(135deg, #0a6e4a, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t("help.title")}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
              {t("help.subtitle")}
            </p>

            <div style={{ maxWidth: 520, margin: "0 auto 12px", position: "relative" }}>
              <MagnifyingGlass size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: search ? "var(--color-accent)" : "var(--color-text-muted)",
                transition: "color 0.2s",
              }} />
              <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("help.searchPlaceholder")}
                style={{
                  width: "100%", padding: "13px 14px 13px 40px", borderRadius: 12,
                  border: `1px solid ${search
                    ? (isDark ? "rgba(52,211,153,0.3)" : "rgba(10,110,74,0.2)")
                    : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                  background: isDark ? "rgba(255,255,255,0.04)" : "white",
                  color: "var(--color-text)", fontSize: 14, outline: "none",
                  fontFamily: "inherit", transition: "all 0.2s",
                }} />
              {search && (
                <button onClick={() => { setSearch(""); inputRef.current?.focus(); }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-text-muted)", padding: 4,
                  }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {!search && trending.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 11, color: "var(--color-text-muted)", marginBottom: 20, flexWrap: "wrap",
              }}>
                <Sparkle size={11} weight="bold" style={{ color: "#f59e0b" }} />
                {trending.map((q, i) => (
                  <button key={i} onClick={() => setSearch(q)}
                    style={{
                      padding: "3px 10px", borderRadius: 100, border: "none",
                      cursor: "pointer", fontSize: 11, fontWeight: 500,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      color: "var(--color-text-secondary)", fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {debouncedSearch && allResults.length > 0 && (
            <div style={{
              ...fadeUp(50), marginBottom: 32, padding: 12, borderRadius: 14,
              background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {allResults.map((res, i) => (
                  <div key={`${res.type}-${res.key}`} onClick={() => {
                    if (res.type === "faq") handleFaqToggle(res.key);
                  }}
                    style={{
                      padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                      transition: "all 0.15s",
                      background: selectedIdx === i
                        ? (isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.06)")
                        : "transparent",
                      borderLeft: `3px solid ${selectedIdx === i ? "#34d399" : "transparent"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: "var(--color-text)",
                        display: "block",
                      }}
                        dangerouslySetInnerHTML={{ __html: highlightText(res.title, debouncedSearch) }}
                      />
                      <span style={{
                        fontSize: 10, padding: "1px 8px", borderRadius: 100,
                        background: res.type === "faq"
                          ? (isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)")
                          : (isDark ? "rgba(52,211,153,0.12)" : "rgba(52,211,153,0.08)"),
                        color: res.type === "faq" ? "#3b82f6" : "#34d399",
                        fontWeight: 600,
                      }}>
                        {res.type === "faq" ? "FAQ" : t("help.categoryLabel") || "Catégorie"}
                      </span>
                    </div>
                    {res.type === "category" && (
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}
                        dangerouslySetInnerHTML={{ __html: highlightText(res.desc, debouncedSearch) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {debouncedSearch && allResults.length === 0 && (
            <div style={{
              ...fadeUp(50), textAlign: "center", padding: "24px", marginBottom: 32,
              borderRadius: 14, background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {t("help.noResults")}
              </p>
            </div>
          )}

          {!debouncedSearch && (
            <StaggerContainer>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12, marginBottom: 48,
              }}>
                {CAT_KEYS.map((key) => {
                  const Icon = CAT_ICONS[key];
                  return (
                    <StaggerItem key={key}>
                      <div style={{
                        padding: 20, borderRadius: 14,
                        background: isDark ? "rgba(255,255,255,0.02)" : "white",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: 12, color: isDark ? "#34d399" : "#0a6e4a",
                        }}>
                          <Icon size={18} weight="fill" />
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "var(--color-text)" }}>
                          {t(`help.cat.${key}`)}
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                          {t(`help.cat.${key}Desc`)}
                        </p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </div>
            </StaggerContainer>
          )}

          <div style={fadeUp(200)}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--color-text)" }}>
              {t("help.faqTitle")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQ_KEYS.map((k, i) => {
                const isOpen = openFaq === k;
                return (
                  <details key={k} open={isOpen}
                    onToggle={() => handleFaqToggle(k)}
                    style={{
                      padding: "16px 20px", borderRadius: 12,
                      background: isDark ? "rgba(255,255,255,0.02)" : "white",
                      border: `1px solid ${isOpen
                        ? (isDark ? "rgba(52,211,153,0.2)" : "rgba(10,110,74,0.15)")
                        : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`,
                      cursor: "pointer", transition: "border 0.2s",
                    }}
                  >
                    <summary style={{
                      fontWeight: 600, fontSize: 14, color: "var(--color-text)",
                      outline: "none", display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
                        color: isDark ? "#34d399" : "#0a6e4a",
                        fontSize: 11, fontWeight: 800,
                      }}>{i + 1}</span>
                      {t(`help.${k}q`)}
                    </summary>
                    <p style={{
                      marginTop: 12, fontSize: 13, color: "var(--color-text-secondary)",
                      lineHeight: 1.7, paddingLeft: 28,
                    }}>
                      {t(`help.${k}r`)}
                    </p>
                  </details>
                );
              })}
            </div>
          </div>

          <div style={{
            ...fadeUp(300), textAlign: "center", marginTop: 48,
            padding: 32, borderRadius: 14,
            background: isDark ? "rgba(255,255,255,0.02)" : "white",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          }}>
            <p style={{ fontSize: 14, color: "var(--color-text)", fontWeight: 600, marginBottom: 4 }}>
              {t("help.ctaTitle")}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
              {t("help.ctaDesc")}
            </p>
            <a href="/contact" style={{
              padding: "10px 24px", borderRadius: 10,
              background: "var(--color-accent-gradient)", color: "white",
              fontWeight: 600, fontSize: 13, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              {t("help.ctaButton")} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
