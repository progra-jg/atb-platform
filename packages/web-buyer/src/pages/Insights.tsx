import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, TrendUp, TrendDown, SealCheck, Cube,
  Clock, CalendarBlank, MagnifyingGlass, PaperPlaneTilt,
  Newspaper, User, ChartBar, SpinnerGap, CheckCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import { Tag } from "../components/Badge";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import SEO from "../components/SEO";
import Card from "../components/ui/Card";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchMarketPrices } from "../services/market";
import { fetchPriceHistory } from "../services/prices";
import { tCrop } from "../utils/i18n";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  ARTICLES, CATEGORIES, CULTURE_GRADIENTS, EUDR_TIMELINE,
  getArticleContent, formatArticleDate, getReadTimeLabel,
} from "../data/insights";
import type { Article } from "../data/insights";
import { formatNumber } from "../utils/format";

const CATEGORY_ICONS: Record<string, Icon> = {
  Newspaper, ChartBar, SealCheck, Cube,
};

const PER_PAGE = 4;

function PriceMiniChart() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { data } = useQuery({ queryKey: ["insight-prices"], queryFn: () => fetchPriceHistory("Maïs", 6), refetchInterval: 180000 });
  const chartData = data?.[0]?.data ?? [];
  if (chartData.length === 0) return null;

  return (
    <div style={{
      background: colors.surface, borderRadius: 14,
      border: `1.5px solid ${colors.border}`,
      boxShadow: colors.shadowSm, overflow: "hidden", padding: "16px 20px",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 12 }}>
        {t("insights.priceTrend")}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => formatNumber(v)} />
          <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 }} formatter={(value: any) => [formatNumber(Number(value)), i18n.language === "fr" ? "Prix" : "Price"]} />
          <Line type="monotone" dataKey="price" stroke={colors.accent} strokeWidth={2} dot={{ r: 3, fill: colors.accent }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ArticleCard({ article, index, lang, onSelect }: { article: Article; index: number; lang: string; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const content = getArticleContent(article.id, lang);
  const CatIcon = CATEGORY_ICONS[article.category as keyof typeof CATEGORY_ICONS] || Newspaper;
  const gradient = CULTURE_GRADIENTS[article.imageLabel] || `linear-gradient(135deg, ${colors.accent}, #34d399)`;

  return (
    <div
      role="article"
      tabIndex={0}
      aria-label={content.title}
      onClick={() => onSelect(article.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(article.id); } }}
      style={{
        background: colors.surface, borderRadius: 14,
        border: `1.5px solid ${colors.border}`,
        boxShadow: colors.shadowSm, overflow: "hidden", cursor: "pointer", transition: "all 0.25s ease",
        animation: `fadeSlideUp 0.5s ease ${index * 0.06}s both`,
        outline: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = colors.shadowSm; e.currentTarget.style.transform = "translateY(0)"; }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = colors.shadowSm; }}
    >
      <div style={{
        height: 120,
        background: gradient,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        padding: 14, position: "relative",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
          padding: "3px 10px", borderRadius: 16, fontSize: 9, fontWeight: 700,
          color: "white", display: "flex", alignItems: "center", gap: 3,
        }}>
          <CatIcon size={10} /> {t(`insights.categoryLabels.${article.category}`)}
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{getReadTimeLabel(article.readTime, lang)}</span>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, lineHeight: 1.4, marginBottom: 6 }}>
          {content.title}
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {content.summary}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {article.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
          <ArrowRight size={14} color={colors.textMuted} />
        </div>
      </div>
    </div>
  );
}

function NewsletterForm() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg(i18n.language === "en" ? "Please enter a valid email address" : "Veuillez entrer une adresse email valide");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "insights" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setErrorMsg(i18n.language === "en" ? "Subscription failed. Please try again." : "Échec de l'abonnement. Veuillez réessayer.");
      setStatus("error");
    }
  }, [email, i18n.language]);

  return (
    <Card variant="bordered" style={{ padding: isMobile ? 20 : 32, textAlign: "center" }}>
      <Newspaper size={isMobile ? 28 : 36} color={colors.accent} weight="fill" style={{ marginBottom: 8 }} />
      <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, margin: "0 0 4px", color: colors.text }}>
        {t("insights.newsletter.title")}
      </h3>
      <p style={{ fontSize: isMobile ? 12 : 13, color: colors.textMuted, margin: "0 0 16px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
        {t("insights.newsletter.desc")}
      </p>
      {status === "success" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#2e7d32", fontWeight: 600, fontSize: 14, padding: 12 }}>
          <CheckCircle size={18} weight="fill" /> {t("insights.newsletter.success")}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
              placeholder={t("insights.newsletter.placeholder")}
              disabled={status === "loading"}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? "newsletter-error" : undefined}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                border: `1.5px solid ${status === "error" ? "#c62828" : colors.borderLight}`,
                outline: "none", boxSizing: "border-box",
                background: colors.inputBg, color: colors.text,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { if (status !== "error") e.currentTarget.style.borderColor = colors.accent; }}
              onBlur={(e) => { if (status !== "error") e.currentTarget.style.borderColor = colors.borderLight; }} />
          </div>
          <button onClick={handleSubscribe} disabled={status === "loading"} style={{
            display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
            background: status === "loading" ? colors.surface : `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            color: status === "loading" ? colors.textMuted : "white",
            border: status === "loading" ? `1px solid ${colors.borderLight}` : "none",
            padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            opacity: status === "loading" ? 0.6 : 1,
            transition: "all 0.2s",
          }}>
            {status === "loading" ? (
              <SpinnerGap size={14} weight="bold" style={{ animation: "spin 0.8s linear infinite" }} />
            ) : (
              <PaperPlaneTilt size={14} weight="fill" />
            )}
            {status === "loading" ? t("common.loading") : t("insights.newsletter.subscribe")}
          </button>
        </div>
      )}
      {status === "error" && errorMsg && (
        <div id="newsletter-error" role="alert" style={{ fontSize: 11, color: "#c62828", marginTop: 8 }}>
          {errorMsg}
        </div>
      )}
    </Card>
  );
}

function Insights() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PER_PAGE);
  const lang = i18n.language;

  const { data: marketPrices } = useQuery({
    queryKey: ["market-prices"],
    queryFn: fetchMarketPrices,
    refetchInterval: 180000,
  });

  const featured = ARTICLES.find((a) => a.featured);

  const filtered = useMemo(() => {
    let result = ARTICLES.filter((a) => !a.featured);
    if (category !== "all") result = result.filter((a) => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const content = getArticleContent(a.id, lang);
        return (
          content.title.toLowerCase().includes(q) ||
          content.summary.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.includes(q))
        );
      });
    }
    return result;
  }, [category, search, lang]);

  const paged = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const handleCardClick = useCallback((id: string) => navigate(`/insights/${id}`), [navigate]);

  return (
    <FadeIn>
      <SEO
        title={t("insights.pageTitle")}
        description={t("insights.subtitle")}
        lang={lang}
        path={window.location.pathname}
        ogType="website"
      />
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("insights.pageTitle") },
        ]} />
        <PageTitle
          title={t("insights.pageTitle")}
          subtitle={t("insights.subtitle")}
        />

        <div style={{
          display: "flex", gap: isMobile ? 8 : 16, marginBottom: isMobile ? 20 : 28,
          overflowX: "auto", paddingBottom: 4,
        }}>
          {(marketPrices ?? []).slice(0, 3).map((m: any, i: number) => {
            const Trend = m.change >= 0 ? TrendUp : TrendDown;
            return (
              <div key={m.crop} style={{
                flex: 1, minWidth: isMobile ? 140 : 200,
                background: colors.surface, borderRadius: 12,
                padding: isMobile ? "10px 14px" : "14px 18px",
                border: `1.5px solid ${colors.border}`,
                boxShadow: colors.shadowSm,
                display: "flex", flexDirection: "column",
              }}>
                <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: m.color || colors.accent }}>{tCrop(m.crop)}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: colors.text }}>
                    {formatNumber(m.price)}
                  </span>
                  <span style={{ fontSize: 10, color: colors.textMuted }}>{t("common.currency")}/kg</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Trend size={12} color={m.change >= 0 ? "#2e7d32" : "#c62828"} weight="bold" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: m.change >= 0 ? "#2e7d32" : "#c62828" }}>
                    {m.change >= 0 ? "+" : ""}{m.change}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <PriceMiniChart />
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button onClick={() => navigate("/prices")} style={{
              background: "none", border: "none", color: colors.accent, fontSize: 12,
              fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {t("insights.viewHistory")} <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {featured && (
          <div
            role="article"
            tabIndex={0}
            aria-label={getArticleContent(featured.id, lang).title}
            onClick={() => handleCardClick(featured.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(featured.id); }}}
            style={{
              background: colors.surface, borderRadius: 16, overflow: "hidden",
              border: `1.5px solid ${colors.border}`,
              boxShadow: colors.shadowMd, marginBottom: isMobile ? 20 : 28,
              cursor: "pointer", transition: "all 0.25s ease",
              outline: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = colors.shadowMd; e.currentTarget.style.transform = "none"; }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = colors.shadowMd; }}
          >
            <div style={{
              height: isMobile ? 160 : 220,
              background: CULTURE_GRADIENTS[featured.imageLabel] || `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              display: "flex", alignItems: "flex-end", padding: isMobile ? 16 : 24,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: isMobile ? 12 : 16, left: isMobile ? 12 : 16,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "white",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <ChartBar size={12} /> {t("insights.featuredBadge")}
              </div>
              <div style={{ color: "white", maxWidth: "80%" }}>
                <div style={{ fontSize: isMobile ? 14 : 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
                  {getArticleContent(featured.id, lang).title}
                </div>
                <div style={{ fontSize: isMobile ? 11 : 13, opacity: 0.85, lineHeight: 1.5 }}>
                  {getArticleContent(featured.id, lang).summary}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: isMobile ? 10 : 11, opacity: 0.7 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <User size={11} /> {featured.author}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CalendarBlank size={11} /> {formatArticleDate(featured.date, lang)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> {getReadTimeLabel(featured.readTime, lang)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 1 260px" }}>
            <MagnifyingGlass size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PER_PAGE); }}
              placeholder={t("insights.searchPlaceholder")}
              aria-label={t("insights.searchPlaceholder")}
              style={{
                width: "100%", padding: "8px 10px 8px 30px", borderRadius: 10, fontSize: 13,
                border: `1.5px solid ${colors.borderLight}`, outline: "none",
                background: colors.inputBg, color: colors.text, boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }} />
          </div>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon];
            const active = category === cat.key;
            return (
              <button key={cat.key} onClick={() => { setCategory(cat.key); setVisible(PER_PAGE); }} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: active ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.surface,
                color: active ? "white" : colors.text,
                border: active ? "none" : `1.5px solid ${colors.borderLight}`,
                padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                fontFamily: "inherit",
              }}>
                <Icon size={14} weight={active ? "fill" : "regular"} />
                {t(cat.labelKey)}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", color: colors.textMuted,
          }}>
            <Newspaper size={40} weight="thin" style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
              {lang === "en" ? "No articles found" : "Aucun article trouvé"}
            </p>
            <p style={{ fontSize: 12, margin: 0 }}>
              {lang === "en" ? "Try adjusting your search or filters." : "Essayez de modifier votre recherche ou vos filtres."}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: isMobile ? 12 : 16, marginBottom: isMobile ? 24 : 32,
            }}>
              {paged.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} lang={lang} onSelect={handleCardClick} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <button onClick={() => setVisible((v: number) => v + PER_PAGE)} style={{
                  background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                  color: colors.text, padding: "10px 32px", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.text; }}>
                  {lang === "en" ? `Show more (${filtered.length - visible} remaining)` : `Voir plus (${filtered.length - visible} restants)`}
                </button>
              </div>
            )}
          </>
        )}

        <EUDRTimelineSection lang={lang} isMobile={isMobile} />
        <NewsletterForm />
      </div>
    </FadeIn>
  );
}

function EUDRTimelineSection({ lang, isMobile }: { lang: string; isMobile: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.accent}, #059669, #34d399)`, borderRadius: 14,
      padding: isMobile ? 16 : 28, color: "white", marginBottom: isMobile ? 20 : 28,
    }}>
      <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={18} /> {t("insights.eudrTimeline.title")}
      </h3>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 8, top: 6, bottom: 6, width: 2, background: "rgba(255,255,255,0.25)" }} />
        {EUDR_TIMELINE.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < EUDR_TIMELINE.length - 1 ? 16 : 0, position: "relative", paddingLeft: 0 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: i === 0 ? "#f9a825" : "rgba(255,255,255,0.3)",
              border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0, zIndex: 1, marginTop: 2,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.7, marginBottom: 1 }}>{formatArticleDate(item.date, lang)}</div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>{t(item.titleKey)}</div>
              <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.8, marginTop: 2 }}>{t(item.descKey)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Insights;
