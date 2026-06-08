import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "../components/PageTransition";
import { Rocket, Plus, Bug, Sparkle, Funnel, Copy, Check } from "@phosphor-icons/react";

const LAST_VIEWED_KEY = "atb_changelog_last_viewed";

const VERSIONS = [
  { ver: "v2.4.0", date: "2026-05-20", type: "major" as const, key: "v240", itemIcons: [Rocket, Rocket, Plus, Sparkle] },
  { ver: "v2.3.0", date: "2026-05-06", type: "minor" as const, key: "v230", itemIcons: [Plus, Plus, Rocket, Bug] },
  { ver: "v2.2.0", date: "2026-04-22", type: "minor" as const, key: "v220", itemIcons: [Rocket, Rocket, Sparkle, Plus] },
  { ver: "v2.1.0", date: "2026-04-08", type: "minor" as const, key: "v210", itemIcons: [Rocket, Rocket, Plus, Bug] },
  { ver: "v2.0.0", date: "2026-03-20", type: "major" as const, key: "v200", itemIcons: [Rocket, Rocket, Sparkle, Sparkle] },
  { ver: "v1.1.0", date: "2026-03-01", type: "minor" as const, key: "v110", itemIcons: [Rocket, Plus, Bug] },
  { ver: "v1.0.0", date: "2026-02-15", type: "major" as const, key: "v100", itemIcons: [Rocket, Rocket, Rocket] },
];

const TYPE_ORDER = ["major", "minor", "patch"] as const;
type FilterType = "all" | "major" | "minor";

function getVersionBadge(type: string) {
  switch (type) {
    case "major": return { label: "Major", bg: "rgba(52,211,153,0.15)", color: "#34d399" };
    case "minor": return { label: "Minor", bg: "rgba(59,130,246,0.15)", color: "#3b82f6" };
    case "patch": return { label: "Patch", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
    default: return { label: type, bg: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" };
  }
}

function isNew(verDate: string): boolean {
  try {
    const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
    if (!lastViewed) return false;
    return new Date(verDate) > new Date(lastViewed);
  } catch { return false; }
}

function markViewed() {
  try { localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString()); } catch {}
}

export default function Changelog() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [copiedVer, setCopiedVer] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => setVisible(true), []);

  useEffect(() => { markViewed(); }, []);

  const filteredVersions = useMemo(() => {
    const result = filter === "all" ? VERSIONS : VERSIONS.filter((v) => v.type === filter);
    const count = result.filter((v) => isNew(v.date)).length;
    setNewCount(count);
    return result;
  }, [filter]);

  useEffect(() => {
    const count = VERSIONS.filter((v) => isNew(v.date)).length;
    setNewCount(count);
  }, []);

  const copyToClipboard = async (ver: string) => {
    try {
      await navigator.clipboard.writeText(ver);
      setCopiedVer(ver);
      setTimeout(() => setCopiedVer(null), 2000);
    } catch {}
  };

  const fadeUp = (d: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms`,
  });

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: isDark ? "#070b09" : "#f4f6f5" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px 100px" }}>
          <div style={{ textAlign: "center", ...fadeUp(0) }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 100, marginBottom: 16,
              background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
              color: isDark ? "#34d399" : "#0a6e4a", fontSize: 11, fontWeight: 600,
            }}>
              <Sparkle size={12} /> v2.4.0
              {newCount > 0 && (
                <span style={{
                  marginLeft: 4, padding: "1px 6px", borderRadius: 100,
                  background: "#ef4444", color: "white", fontSize: 9,
                }}>
                  +{newCount}
                </span>
              )}
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 8,
              background: "linear-gradient(135deg, #0a6e4a, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t("changelog.title")}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24, maxWidth: 450, margin: "0 auto 24px" }}>
              {t("changelog.subtitle")}
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
              {(["all", "major", "minor"] as FilterType[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 16px", borderRadius: 100, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    fontFamily: "inherit", transition: "all 0.2s",
                    background: filter === f
                      ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)")
                      : "transparent",
                    color: filter === f ? "var(--color-text)" : "var(--color-text-muted)",
                    boxShadow: filter === f
                      ? (isDark ? "0 0 0 1px rgba(255,255,255,0.1)" : "0 0 0 1px rgba(0,0,0,0.08)")
                      : "none",
                  }}
                >
                  <Funnel size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {f === "all" ? (t("changelog.filterAll") || "Tout")
                    : f === "major" ? "Major"
                    : "Minor"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {filteredVersions.map((entry, i) => {
              const badge = getVersionBadge(entry.type);
              const isNewVersion = isNew(entry.date);
              return (
                <div key={i} style={{
                  ...fadeUp(100 + i * 60), padding: "20px 24px", borderRadius: 14,
                  background: isDark ? "rgba(255,255,255,0.02)" : "white",
                  border: `1px solid ${isNewVersion
                    ? (isDark ? "rgba(52,211,153,0.2)" : "rgba(10,110,74,0.15)")
                    : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`,
                  position: "relative",
                }}>
                  {isNewVersion && (
                    <span style={{
                      position: "absolute", top: -6, right: 20,
                      padding: "2px 10px", borderRadius: 100,
                      background: "#34d399", color: "white",
                      fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {t("changelog.new") || "Nouveau"}
                    </span>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 800, color: "var(--color-text)",
                        fontFamily: "monospace", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                        onClick={() => copyToClipboard(entry.ver)}
                        title={t("changelog.copyVersion") || "Copier la version"}
                      >
                        {entry.ver}
                        {copiedVer === entry.ver ? (
                          <Check size={12} color="#34d399" />
                        ) : (
                          <Copy size={11} style={{ opacity: 0.3 }} />
                        )}
                      </span>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 100,
                        background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700,
                      }}>{badge.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{entry.date}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
                    {t(`changelog.${entry.key}_title`)}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {entry.itemIcons.map((Icon, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        <Icon size={14} color={badge.color} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{t(`changelog.${entry.key}_item${j + 1}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div style={{ ...fadeUp(500), textAlign: "center", marginTop: 40, padding: "24px", borderRadius: 14, border: `1px dashed ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              {t("changelog.roadmapTitle")}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {t("changelog.roadmapDesc")}
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
