import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CalendarBlank, Clock, User, ArrowRight,
  CaretLeft, CaretRight,
  LinkedinLogo, XLogo, WhatsappLogo, EnvelopeSimple,
  MagnifyingGlass, BellRinging, FileText, SealCheck, UserSwitch, ChartBar, SpinnerGap,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import FadeIn from "../components/FadeIn";
import { Tag } from "../components/Badge";
import Breadcrumb from "../components/Breadcrumb";
import SEO from "../components/SEO";
import { useIsMobile } from "../hooks/useMediaQuery";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { fetchLots } from "../services/lots";
import { fetchMarketPrices } from "../services/market";
import {
  ARTICLES, CULTURE_GRADIENTS, AUTHORS, ARTICLE_ENTITIES,
  getArticleContent, formatArticleDate, getReadTimeLabel,
} from "../data/insights";
import type { AuthorInfo, ArticleEntities, ActionGroup } from "../data/insights";
import type { Lot } from "../types";
import { formatNumber } from "../utils/format";

const SHARE_BUTTONS = [
  { icon: LinkedinLogo, label: "LinkedIn", color: "#0a66c2", getUrl: (u: string, t: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { icon: XLogo, label: "X", color: "#000", getUrl: (u: string, t: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { icon: WhatsappLogo, label: "WhatsApp", color: "#25d366", getUrl: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + " " + u)}` },
  { icon: EnvelopeSimple, label: "Email", color: "#ea4335", getUrl: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
];

function ShareButtons({ url, title }: { url: string; title: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <div style={{ margin: "32px 0 24px" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 10 }}>
        {t("insights.share")}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        {SHARE_BUTTONS.map((btn) => (
          <a key={btn.label} href={btn.getUrl(url, title)} target="_blank" rel="noopener noreferrer"
            aria-label={t("insights.shareOn", { platform: btn.label })}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 10,
              background: `${btn.color}10`, color: btn.color,
              border: `1px solid ${btn.color}20`, textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = btn.color; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${btn.color}10`; e.currentTarget.style.color = btn.color; }}>
            <btn.icon size={18} weight="bold" />
          </a>
        ))}
      </div>
    </div>
  );
}

function PrevNextNav({ article, lang }: { article: { id: string; category: string }; lang: string }) {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const sameCat = ARTICLES.filter((a) => a.category === article.category);
  const idx = sameCat.findIndex((a) => a.id === article.id);
  const prev = idx > 0 ? sameCat[idx - 1] : null;
  const next = idx < sameCat.length - 1 ? sameCat[idx + 1] : null;

  const handleNav = (id: string) => {
    navigate(`/insights/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 28,
      justifyContent: "space-between",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {prev && (
          <button onClick={() => handleNav(prev.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: colors.surface, border: `1px solid ${colors.borderLight}`,
              borderRadius: 12, padding: "12px 16px", cursor: "pointer",
              fontSize: 12, color: colors.text, textAlign: "left",
              width: "100%", fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}>
            <CaretLeft size={14} color={colors.accent} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>
                {lang === "en" ? "Previous" : "Précédent"}
              </div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, fontWeight: 600 }}>
                {getArticleContent(prev.id, lang).title}
              </div>
            </div>
          </button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {next && (
          <button onClick={() => handleNav(next.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end",
              background: colors.surface, border: `1px solid ${colors.borderLight}`,
              borderRadius: 12, padding: "12px 16px", cursor: "pointer",
              fontSize: 12, color: colors.text, textAlign: "right",
              width: "100%", fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>
                {lang === "en" ? "Next" : "Suivant"}
              </div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, fontWeight: 600 }}>
                {getArticleContent(next.id, lang).title}
              </div>
            </div>
            <CaretRight size={14} color={colors.accent} style={{ flexShrink: 0 }} />
          </button>
        )}
      </div>
    </div>
  );
}

const ACTION_ICONS: Record<string, Icon> = {
  MagnifyingGlass, BellRinging, FileText, SealCheck, UserSwitch, ChartBar,
};

function SmartArticlePanel({ article, lang, user }: { article: { id: string }; lang: string; user: unknown }) {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const entities = ARTICLE_ENTITIES[article.id];
  if (!entities) return null;

  const visible = entities.actions.filter((a) => !a.requiresAuth || user);
  if (visible.length === 0) return null;

  const { data: allLots, isFetching: lotsLoading } = useQuery<Lot[]>({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: marketPrices } = useQuery<any[]>({
    queryKey: ["insight-market-prices"],
    queryFn: fetchMarketPrices,
    staleTime: 180000,
  });

  const cropLotCounts: Record<string, number> = {};
  entities.crops.forEach((crop) => {
    const count = allLots?.filter((l: any) => l.culture === crop).length ?? 0;
    cropLotCounts[crop] = count;
  });

  const cropPrices: Record<string, number> = {};
  (marketPrices ?? []).forEach((m: any) => {
    if (m.crop && m.price) cropPrices[m.crop] = m.price;
  });

  const getBadge = (action: ActionGroup) => {
    if (!user) return null;
    const crop = action.params?.culture;
    if (crop && cropLotCounts[crop] !== undefined) {
      const count = cropLotCounts[crop];
      if (count === 0) return "0";
      return count > 99 ? "99+" : String(count);
    }
    return null;
  };

  const getPrice = (crop: string) => {
    const p = cropPrices[crop];
    return p
      ? `${formatNumber(p)} ${t("common.currency")}`
      : null;
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.accent}08, ${colors.accent}02)`,
      borderRadius: 14, border: `1px solid ${colors.accent}20`,
      padding: 20, marginBottom: 32,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <ChartBar size={14} color={colors.accent} />
        {t("insights.smartActions.title")}
      </div>
      {entities.crops.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {entities.crops.map((crop) => {
            const hasPrice = cropPrices[crop] !== undefined;
            const hasCount = user && cropLotCounts[crop] !== undefined;
            return (
              <div key={crop} style={{
                background: colors.surface, borderRadius: 8,
                border: `1px solid ${colors.borderLight}`,
                padding: "6px 12px", fontSize: 12,
              }}>
                <span style={{ fontWeight: 600, color: colors.text }}>{crop}</span>
                {hasPrice && (
                  <span style={{ color: colors.accent, marginLeft: 6, fontWeight: 600 }}>
                    {getPrice(crop)}
                  </span>
                )}
                {hasCount && lotsLoading ? (
                  <SpinnerGap size={10} style={{ marginLeft: 6, animation: "spin 0.8s linear infinite", verticalAlign: "middle" }} />
                ) : hasCount ? (
                  <span style={{
                    marginLeft: 6, fontSize: 10,
                    color: cropLotCounts[crop] > 0 ? "#2e7d32" : colors.textMuted,
                  }}>
                    {cropLotCounts[crop] > 0
                      ? `${cropLotCounts[crop]} lot${cropLotCounts[crop] > 1 ? "s" : ""}`
                      : lang === "en" ? "No lots" : "Aucun lot"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {visible.map((action) => {
          const Icon = ACTION_ICONS[action.icon] || ChartBar;
          const badge = getBadge(action);
          return (
            <button key={action.labelKey} onClick={() => {
              const params = action.params ? "?" + new URLSearchParams(action.params).toString() : "";
              navigate(action.path + params);
            }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: colors.surface, border: `1px solid ${colors.borderLight}`,
                borderRadius: 10, padding: "8px 14px", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: colors.text,
                fontFamily: "inherit", transition: "all 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = `${colors.accent}08`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.surface; }}>
              <Icon size={14} color={colors.accent} />
              {t(action.labelKey)}
              {badge && (
                <span style={{
                  background: colors.accent, color: "white", fontSize: 9, fontWeight: 700,
                  borderRadius: 8, padding: "1px 6px", lineHeight: "16px",
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AuthorCard({ author, lang }: { author: AuthorInfo; lang: string }) {
  const { colors } = useTheme();
  const articleCount = ARTICLES.filter((a) => a.author === author.name).length;
  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      background: colors.surface, borderRadius: 12,
      border: `1px solid ${colors.borderLight}`,
      padding: 16, marginBottom: 24,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: `linear-gradient(135deg, ${author.color}, ${author.color}99)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}>{author.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{author.name}</div>
        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>{author.role} · {articleCount} article{articleCount > 1 ? "s" : ""}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
          {author.bio[lang === "en" ? "en" : "fr"]}
        </div>
      </div>
    </div>
  );
}

function renderBody(text: string, colors: ReturnType<typeof useTheme>["colors"]): JSX.Element[] {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return paragraphs.map((p, i) => {
    const isFirst = i === 0;
    return (
      <p key={i} style={{
        margin: 0,
        lineHeight: 1.85,
        fontSize: 15,
        color: colors.textSecondary,
      }}>
        {isFirst && <span style={{
          float: "left",
          fontSize: 52,
          lineHeight: 0.85,
          fontWeight: 700,
          color: colors.accent,
          marginRight: 8,
          marginTop: 4,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}>{p.charAt(0)}</span>}
        {isFirst ? p.slice(1) : p}
      </p>
    );
  });
}

function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const lang = i18n.language;

  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const article = ARTICLES.find((a) => a.id === id);
  const content = article ? getArticleContent(id!, lang) : null;

  const related = useMemo(() => {
    if (!article) return [];
    return ARTICLES
      .filter((a) => a.id !== article.id && a.category === article.category)
      .slice(0, 2);
  }, [article]);

  const handleRelatedClick = (relatedId: string) => {
    navigate(`/insights/${relatedId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!article || !content) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: isMobile ? 60 : 80 }}>
          <h2 style={{ color: colors.text, marginBottom: 8 }}>{t("insights.notFound")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 20 }}>{t("insights.notFoundDesc")}</p>
          <button onClick={() => navigate("/insights")}
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              color: "white", border: "none", padding: "10px 24px",
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>{t("insights.backToArticles")}</button>
        </div>
      </FadeIn>
    );
  }

  const gradient = CULTURE_GRADIENTS[article.imageLabel] || `linear-gradient(135deg, ${colors.accent}, #34d399)`;

  return (
    <FadeIn>
      <SEO
        title={content.title}
        description={content.summary}
        lang={lang}
        path={window.location.pathname}
        ogType="article"
      />
      <ScrollProgressBar progress={scrollProgress} visible={scrollProgress > 0 && scrollProgress < 1} />
      <article style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "12px" : "24px" }}>
        <Breadcrumb crumbs={[
          { label: t("nav.insights"), path: "/insights" },
          { label: content.title.substring(0, 40) + "…" },
        ]} />

        <button onClick={() => navigate("/insights")} style={{
          background: "none", border: "none", cursor: "pointer", color: colors.textMuted,
          display: "flex", alignItems: "center", gap: 4, fontSize: 13, padding: "8px 0", marginBottom: 16,
          fontFamily: "inherit",
        }}>
          <ArrowLeft size={14} /> {t("insights.backToArticles")}
        </button>

        <div style={{
          width: "100%", height: isMobile ? 160 : 240, borderRadius: 16,
          background: gradient, display: "flex", alignItems: "flex-end",
          padding: isMobile ? 16 : 24, marginBottom: 28,
          boxShadow: `0 8px 32px ${colors.accent}25`,
        }}>
          <span style={{
            background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px",
            borderRadius: 20, fontSize: 12, fontWeight: 600, backdropFilter: "blur(4px)",
          }}>{t(`insights.categoryLabels.${article.category}`)}</span>
        </div>

        <h1 style={{
          fontSize: isMobile ? 22 : 32, fontWeight: 700, color: colors.text,
          margin: "0 0 14px", lineHeight: 1.25, letterSpacing: "-0.5px",
        }}>
          {content.title}
        </h1>

        <div style={{
          display: "flex", gap: 16, fontSize: 12, color: colors.textMuted,
          marginBottom: 32, flexWrap: "wrap", paddingBottom: 24,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={12} /> {article.author}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalendarBlank size={12} /> {formatArticleDate(article.date, lang)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {getReadTimeLabel(article.readTime, lang)}</span>
        </div>

        <div style={{
          fontSize: isMobile ? 14 : 15, color: colors.textSecondary, lineHeight: 1.85,
          marginBottom: 32, fontStyle: "italic", paddingLeft: 16,
          borderLeft: `3px solid ${colors.accent}50`,
        }}>
          <p style={{ margin: 0 }}>{content.summary}</p>
        </div>

        <SmartArticlePanel article={article} lang={lang} user={user} />

        <div style={{
          display: "flex", flexDirection: "column", gap: 20,
          marginBottom: 32,
        }}>
          {content.body ? renderBody(content.body, colors) : (
            <p style={{ margin: 0, lineHeight: 1.85, fontSize: 15, color: colors.textSecondary }}>
              {content.summary}
            </p>
          )}
        </div>

        {(() => { const ai = AUTHORS[article.author]; return ai ? <AuthorCard author={ai} lang={lang} /> : null; })()}

        {article.tags.length > 0 && (
          <div style={{
            display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 40,
            paddingTop: 24, borderTop: `1px solid ${colors.borderLight}`,
          }}>
            {article.tags.map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        )}

        <ShareButtons url={window.location.href} title={content.title} />

        <PrevNextNav article={{ id: article.id, category: article.category }} lang={lang} />

        {related.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
              {lang === "en" ? "Related articles" : "Articles similaires"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {related.map((r) => {
                const rc = getArticleContent(r.id, lang);
                return (
                  <div key={r.id}
                    role="article"
                    tabIndex={0}
                    aria-label={rc.title}
                    onClick={() => handleRelatedClick(r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleRelatedClick(r.id); }}}
                    style={{
                      background: colors.surface, borderRadius: 12,
                      border: `1px solid ${colors.borderLight}`,
                      padding: 16, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = `${colors.accent}04`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.surface; }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{rc.title}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>
                        {formatArticleDate(r.date, lang)} · {getReadTimeLabel(r.readTime, lang)}
                      </div>
                    </div>
                    <ArrowRight size={14} color={colors.textMuted} style={{ flexShrink: 0, marginLeft: 12 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </FadeIn>
  );
}

export default ArticleDetailPage;
