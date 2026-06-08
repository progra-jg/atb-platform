import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MagnifyingGlass, Funnel, X, SortAscending, DownloadSimple,
  MapTrifold, List, ChartBar, ArrowsLeftRight, CaretDown, Users,
} from "@phosphor-icons/react";
import Button from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import EmptyState from "../components/EmptyState";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import Skeleton from "../components/Skeleton";
import LotCard from "../components/LotCard";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchLots } from "../services/lots";
import { getFavorites, toggleFavorite } from "../services/favorites";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";
import { rankLots, type RankingContext } from "../utils/ranking";
import { computeLotCompleteness } from "../utils/scoring";
import type { Lot } from "../types";
import { useCompare } from "../context/CompareContext";
import { useCart } from "../context/CartContext";
import { useFollowedFarmers } from "../hooks/useFollowedFarmers";

/* ── International colour standards ── */

const CROP_COLORS: Record<string, string> = {
  Cacao: "#6B3A2A",       // brun cacao
  Coton: "#E8D5B7",       // écru coton
  Anacarde: "#C8A951",    // jaune noix de cajou
  Café: "#8B4513",        // brun café
  Maïs: "#F4D03F",        // jaune maïs
};

const CERT_COLORS: Record<string, string> = {
  EUDR: "#0a6e4a",
  GlobalGAP: "#1565c0",
  Bio: "#7cb342",
  "Fair Trade": "#e65100",
};

const STATUS_COLORS: Record<string, string> = {
  Disponible: "#0a6e4a",
  "En transit": "#e65100",
  Vendu: "#c62828",
};

const REGION_COLORS: Record<string, string> = {
  Zou: "#4a148c", Borgou: "#1a237e", Mono: "#004d40", Ouémé: "#e65100", Atlantique: "#1565c0",
};

function getCropColor(culture: string): string {
  return CROP_COLORS[culture] ?? "#888";
}
function getCertColor(cert: string): string {
  return CERT_COLORS[cert] ?? "#888";
}
function getStatusColor(statut: string): string {
  return STATUS_COLORS[statut] ?? "#888";
}
function getRegionColor(region: string): string {
  return REGION_COLORS[region] ?? "#888";
}
function hexAlpha(hex: string, a: number): string {
  return `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
}

/* ── Helpers ── */

function hashToOffset(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  const latOff = ((h & 0xFFFF) % 1000) / 10000;
  const lngOff = (((h >> 16) & 0xFFFF) % 1000) / 10000;
  return [latOff, lngOff];
}

const FILTERS = [
  { labelKey: "lots.filters.culture", options: ["Cacao", "Coton", "Anacarde", "Café", "Maïs"], key: "culture" as const },
  { labelKey: "lots.filters.certification", options: ["EUDR", "GlobalGAP", "Bio", "Fair Trade"], key: "certification" as const },
  { labelKey: "lots.filters.statut", options: ["Disponible", "En transit", "Vendu"], key: "statut" as const },
  { labelKey: "lots.filters.region", options: ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique"], key: "region" as const },
];

const REGION_COORDS: Record<string, [number, number]> = {
  Zou: [7.25, 2.1], Borgou: [9.85, 2.75], Mono: [6.55, 1.9], Ouémé: [6.6, 2.6], Atlantique: [6.45, 2.35],
};

function exportCSV(lots: Lot[], t: (key: string) => string) {
  const header = `ID,Culture,Origine,Région,Volume,Certification,Statut,Prix (${t("common.currency")}/kg),Producteur,Note,Date`;
  const rows = lots.map((l) =>
    `"${l.id}","${l.culture}","${l.origine}","${l.region}","${l.quantite}","${l.certification}","${l.statut}",${l.prix},"${l.producteur}",${l.note},"${l.date}"`
  );
  const bom = "\uFEFF";
  const blob = new Blob([bom + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `lots_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function LotSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<"prix-asc" | "prix-desc" | "note-asc" | "note-desc" | "date-desc" | "recommended">("recommended");
  const [showMap, setShowMap] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [page, setPage] = useState(1);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [followedOnly, setFollowedOnly] = useState(() => localStorage.getItem("atb_followed_only") === "true");
  const rankDataRef = useRef<Map<string, { rankWeight: number; rankScores: import("../utils/ranking").LotScores; dominantReason: string }>>(new Map());

  useEffect(() => { localStorage.setItem("atb_followed_only", String(followedOnly)); }, [followedOnly]);
  const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { addItem } = useCart();
  const { following } = useFollowedFarmers();
  const followedIds = useMemo(() => new Set(following.map((f) => f.farmerId)), [following]);
  const PER_PAGE = 12;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavorites(getFavorites());
  };

  const { data: lots, isLoading, isError } = useQuery({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const filtered = useMemo(() => {
    let result = (lots ?? []).filter((lot: Lot) => {
      if (search && !lot.id.toLowerCase().includes(search.toLowerCase()) && !lot.culture.toLowerCase().includes(search.toLowerCase()) && !lot.producteur.toLowerCase().includes(search.toLowerCase()) && !lot.region.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilters["culture"] && lot.culture !== activeFilters["culture"]) return false;
      if (activeFilters["certification"] && lot.certification !== activeFilters["certification"]) return false;
      if (activeFilters["statut"] && lot.statut !== activeFilters["statut"]) return false;
      if (activeFilters["region"] && lot.region !== activeFilters["region"]) return false;
      if (followedOnly && lot.producteurId && !followedIds.has(lot.producteurId)) return false;
      return true;
    });

    if (sort === "recommended") {
      const ctx: RankingContext = {
        preferredCrop: activeFilters["culture"] || undefined,
        preferredRegion: activeFilters["region"] || undefined,
        prefersCertified: !!activeFilters["certification"],
      };
      const ranked = rankLots(result, ctx);
      const rankMap = new Map<string, { rankWeight: number; rankScores: import("../utils/ranking").LotScores; dominantReason: string }>();
      result = ranked.map((r) => {
        const { _rankWeight, _scores, ...lot } = r;
        const maxScore = Math.max(_scores.relevance, _scores.trust, _scores.quality, _scores.rotation);
        let dominantReason: string;
        if (_scores.relevance === maxScore) dominantReason = "ranking.relevance";
        else if (_scores.trust === maxScore) dominantReason = "ranking.trust";
        else if (_scores.quality === maxScore) dominantReason = "ranking.quality";
        else dominantReason = "ranking.rotation";
        rankMap.set(lot.id, { rankWeight: _rankWeight, rankScores: _scores, dominantReason });
        return lot as Lot;
      });
      rankDataRef.current = rankMap;
      return result;
    }

    result.sort((a: Lot, b: Lot) => {
      switch (sort) {
        case "prix-asc": return a.prix - b.prix;
        case "prix-desc": return b.prix - a.prix;
        case "note-asc": return a.note - b.note;
        case "note-desc": return b.note - a.note;
        case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        default: return 0;
      }
    });
    return result;
  }, [lots, search, activeFilters, sort, followedOnly, followedIds]);

  React.useEffect(() => { setPage(1); }, [search, activeFilters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stats = useMemo(() => {
    if (!filtered.length) return { count: 0, min: 0, max: 0, avgNote: 0 };
    const prices = filtered.map((l: Lot) => l.prix);
    return {
      count: filtered.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avgNote: Math.round(filtered.reduce((s: number, l: Lot) => s + l.note, 0) / filtered.length),
    };
  }, [filtered]);

  const activeCount = Object.keys(activeFilters).length;

  useEffect(() => {
    if (!showMap || !mapRef.current || !filtered.length) {
      mapInstance.current?.remove();
      mapInstance.current = null;
      return;
    }
    if (!mapInstance.current) {
      const map = L.map(mapRef.current, { zoomControl: true }).setView([8.5, 2.5], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
    }
    const map = mapInstance.current;
    map.eachLayer((l) => { if (l instanceof L.Marker) map.removeLayer(l); });
    filtered.forEach((lot: Lot) => {
      const base = REGION_COORDS[lot.region];
      if (!base) return;
      const [latOff, lngOff] = hashToOffset(lot.id);
      const lat = base[0] + latOff;
      const lng = base[1] + lngOff;
      L.marker([lat, lng]).addTo(map).bindPopup(`
        <b>${tCrop(lot.culture)}</b><br/>
        ${lot.id}<br/>
        <strong>${formatNumber(lot.prix)} ${t("common.currency")}/kg</strong><br/>
        <span style="color:${colors.accent}">● ${t("lotStatus." + lot.statut, lot.statut)}</span>
      `);
    });
  }, [showMap, filtered]);

  const sortLabel = sort === "prix-asc" ? `${t("lots.fields.price")} ↑` : sort === "prix-desc" ? `${t("lots.fields.price")} ↓` : sort === "note-asc" ? `${t("lots.fields.note")} ↑` : sort === "note-desc" ? `${t("lots.fields.note")} ↓` : sort === "recommended" ? t("lots.sort.recommended") : `${t("lots.sort.date")} ↓`;

  return (
    <FadeIn delay={50}>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("lots.title") },
        ]} />
        <PageTitle title={t("lots.title")} subtitle={`${(lots ?? []).length} ${t("lots.subtitle")}`} />

        {/* Search + Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <MagnifyingGlass size={isMobile ? 16 : 18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted, pointerEvents: "none" }} />
            <input type="text" placeholder={t("lots.search")} value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: isMobile ? "10px 14px 10px 38px" : "11px 16px 11px 42px",
                borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
                fontSize: 14, outline: "none",
                background: colors.inputBg, color: colors.text,
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = colors.accent}
              onBlur={(e) => e.target.style.borderColor = colors.borderLight} />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: colors.statBg, border: "none", borderRadius: 4, width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: colors.textMuted, fontSize: 10,
              }}><X size={12} /></button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSortMenu(!showSortMenu)} style={{
                background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                padding: isMobile ? "10px 12px" : "11px 14px", borderRadius: 10,
                cursor: "pointer", color: colors.text, display: "flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}>
                <SortAscending size={16} /> {!isMobile && sortLabel}
                {isMobile && <CaretDown size={10} />}
              </button>
              {showSortMenu && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 4, minWidth: 160,
                  background: colors.surface, borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  boxShadow: colors.shadowLg, overflow: "hidden", zIndex: 20,
                  animation: "fadeSlideUp 0.15s ease",
                }}>
                  {[
                    { key: "recommended", labelKey: "lots.sort.recommended" },
                    { key: "date-desc", labelKey: "lots.sort.date" },
                    { key: "prix-asc", labelKey: "lots.sort.priceAsc" },
                    { key: "prix-desc", labelKey: "lots.sort.priceDesc" },
                    { key: "note-asc", labelKey: "lots.sort.noteAsc" },
                    { key: "note-desc", labelKey: "lots.sort.noteDesc" },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => { setSort(opt.key as typeof sort); setShowSortMenu(false); }} style={{
                      display: "block", width: "100%", padding: "8px 14px",
                      background: sort === opt.key ? colors.accentLight : "transparent",
                      border: "none", textAlign: "left", cursor: "pointer",
                      fontSize: 12, color: sort === opt.key ? colors.accent : colors.text,
                      fontWeight: sort === opt.key ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={(e) => { if (sort !== opt.key) e.currentTarget.style.background = colors.surfaceHover; }}
                      onMouseLeave={(e) => { if (sort !== opt.key) e.currentTarget.style.background = "transparent"; }}
                    >{t(opt.labelKey)}</button>
                  ))}
                </div>
              )}
            </div>
            <Button variant={showFilters || activeCount > 0 ? "primary" : "secondary"} size="md" onClick={() => setShowFilters(!showFilters)}
              icon={<Funnel size={16} weight={showFilters ? "fill" : "regular"} />}
              style={{ fontSize: 12 }}>
              {!isMobile && t("common.filter")}
              {activeCount > 0 && (
                <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{activeCount}</span>
              )}
            </Button>
            <Button variant={showMap ? "primary" : "secondary"} size="md" onClick={() => setShowMap(!showMap)}
              icon={showMap ? <List size={16} /> : <MapTrifold size={16} />}
              style={{ fontSize: 12 }}>
              {!isMobile && (showMap ? t("lots.map.list") : t("lots.map.view"))}
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{
            display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center",
            padding: "10px 12px", borderRadius: 10, background: colors.statBg,
            border: `1px solid ${colors.borderLight}`,
            animation: "fadeSlideUp 0.2s ease",
          }}>
            {FILTERS.map((f) => (
              <select key={f.key} value={activeFilters[f.key] || ""}
                onChange={(e) => {
                  const u = { ...activeFilters };
                  if (e.target.value) u[f.key] = e.target.value;
                  else delete u[f.key];
                  setActiveFilters(u);
                }}
                style={{
                  padding: isMobile ? "7px 10px" : "8px 12px",
                  borderRadius: 8, border: `1.5px solid ${activeFilters[f.key] ? (
                    f.key === "culture" ? getCropColor(activeFilters[f.key]) :
                    f.key === "certification" ? getCertColor(activeFilters[f.key]) :
                    f.key === "statut" ? getStatusColor(activeFilters[f.key]) :
                    f.key === "region" ? getRegionColor(activeFilters[f.key]) : colors.accent
                  ) : colors.borderLight}`,
                  fontSize: 12, background: activeFilters[f.key] ? (
                    f.key === "culture" ? hexAlpha(getCropColor(activeFilters[f.key]), 0.12) :
                    f.key === "certification" ? hexAlpha(getCertColor(activeFilters[f.key]), 0.12) :
                    f.key === "statut" ? hexAlpha(getStatusColor(activeFilters[f.key]), 0.12) :
                    f.key === "region" ? hexAlpha(getRegionColor(activeFilters[f.key]), 0.12) : colors.accentLight
                  ) : colors.inputBg,
                  color: colors.text, outline: "none", cursor: "pointer",
                  flex: isMobile ? "1 1 calc(50% - 4px)" : "0 1 auto",
                  minWidth: isMobile ? 0 : 140, fontWeight: activeFilters[f.key] ? 600 : 400,
                }}>
                <option value="">{t(f.labelKey)}</option>
                {f.options.map((o) => {
                  const dotColor = f.key === "culture" ? getCropColor(o) :
                    f.key === "certification" ? getCertColor(o) :
                    f.key === "statut" ? getStatusColor(o) :
                    f.key === "region" ? getRegionColor(o) : null;
                  const displayLabel = f.key === "culture" ? tCrop(o) : f.key === "statut" ? t("lotStatus." + o, o) : o;
                  return (
                    <option key={o} value={o}
                      style={dotColor ? { backgroundColor: hexAlpha(dotColor, 0.06) } : undefined}>
                      {dotColor ? "\u25CF " : ""}{displayLabel}
                    </option>
                  );
                })}
              </select>
            ))}
            {activeCount > 0 && (
              <button onClick={() => setActiveFilters({})} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", color: colors.error,
                fontSize: 11, cursor: "pointer", fontWeight: 500, padding: "4px 8px",
              }}>
                <X size={12} /> {t("common.reset")}
              </button>
            )}
            {following.length > 0 && (
              <button onClick={() => setFollowedOnly(!followedOnly)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${followedOnly ? colors.accent : colors.borderLight}`,
                background: followedOnly ? `${colors.accent}14` : "transparent",
                color: followedOnly ? colors.accent : colors.textMuted,
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}>
                <Users size={13} weight={followedOnly ? "fill" : "regular"} />
                {t("follow.following")}
              </button>
            )}
          </div>
        )}

        {/* Stats bar */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{
              background: colors.statBg, padding: "5px 10px", borderRadius: 8,
              fontSize: 10, color: colors.textSecondary,
              display: "flex", alignItems: "center", gap: 4,
              border: `1px solid ${colors.borderLight}`,
            }}>
              <ChartBar size={12} /> {stats.count} {t("lots.stats.found")}
            </div>
            <div style={{
              background: colors.statBg, padding: "5px 10px", borderRadius: 8,
              fontSize: 10, color: colors.textSecondary,
              border: `1px solid ${colors.borderLight}`,
            }}>
              {t("lots.stats.price")}: <strong style={{ color: colors.text }}>{formatNumber(stats.min)}–{formatNumber(stats.max)}</strong> {t("common.currency")}/kg
            </div>
            <div style={{
              background: colors.statBg, padding: "5px 10px", borderRadius: 8,
              fontSize: 10, color: colors.textSecondary,
              border: `1px solid ${colors.borderLight}`,
            }}>
              {t("lots.stats.avgNote")}: <strong style={{
                color: stats.avgNote >= 90 ? getStatusColor("Disponible") : stats.avgNote >= 80 ? getStatusColor("En transit") : getStatusColor("Vendu"),
              }}>{stats.avgNote}/100</strong>
            </div>
            {compareList.length >= 2 && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/compare?ids=${compareList.map((l: any) => l.id).join(",")}`)}
                icon={<ArrowsLeftRight size={12} />}>
                {t("compare.title")} ({compareList.length})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => exportCSV(filtered, t)}
              icon={<DownloadSimple size={12} />}>
              {t("lots.export")}
            </Button>
          </div>
        )}

        {/* Active filter pills */}
        {activeCount > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {Object.entries(activeFilters).map(([key, val]) => {
              const color = key === "culture" ? getCropColor(val) :
                key === "certification" ? getCertColor(val) :
                key === "statut" ? getStatusColor(val) :
                key === "region" ? getRegionColor(val) : colors.accent;
              return (
                <span key={key} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: hexAlpha(color, 0.1), color, border: `1px solid ${hexAlpha(color, 0.25)}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                  {key === "culture" ? tCrop(val) : key === "statut" ? t("lotStatus." + val, val) : val}
                  <button onClick={() => {
                    const u = { ...activeFilters };
                    delete u[key];
                    setActiveFilters(u);
                  }} style={{ background: "none", border: "none", color, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 13 }}>
                    <X size={10} weight="bold" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Map */}
        {showMap && (
          <div ref={mapRef} style={{ width: "100%", height: 360, borderRadius: 14, overflow: "hidden", marginBottom: 16, zIndex: 0 }} />
        )}

        {/* Error banner (overlaid when stale cache available) */}
        {isError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            padding: "8px 14px", borderRadius: 10,
            background: colors.errorLight, border: `1px solid ${colors.error}20`,
          }}>
            <span style={{ fontSize: 12, color: colors.error, fontWeight: 500, flex: 1 }}>
              {lots ? t("common.apiUnavailable") : t("common.error")}
            </span>
            <button onClick={() => window.location.reload()} style={{
              background: "none", border: `1px solid ${colors.error}40`, borderRadius: 6,
              padding: "4px 10px", fontSize: 11, color: colors.error, cursor: "pointer",
              fontWeight: 500,
            }}>
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Results */}
        {!showMap && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: colors.surface, borderRadius: 14, padding: 20, border: `1.5px solid ${colors.borderLight}` }}>
                  <Skeleton height={56} radius={10} mb={12} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} height={13} width="90%" />)}
                  </div>
                </div>
              ))
            ) : (
              paginated.map((lot: Lot, i: number) => (
                <div key={lot.id}>
                  {(() => {
                    const rd = rankDataRef.current.get(lot.id);
                    return (
                      <LotCard
                        index={i} lot={lot}
                        fav={favorites.includes(lot.id)}
                        onToggleFav={(e) => handleToggleFav(e, lot.id)}
                        isInCompare={isInCompare(lot.id)}
                        onToggleCompare={() => isInCompare(lot.id) ? removeFromCompare(lot.id) : addToCompare(lot)}
                        cartFeedback={cartFeedback}
                        onAddToCart={() => {
                          addItem({ lotId: lot.id, culture: lot.culture, origine: lot.origine, quantite: lot.quantite, prix: lot.prix, producteurId: lot.producteurId || "", certification: lot.certification, quantiteChoisie: 1 });
                          setCartFeedback(lot.id);
                          setTimeout(() => setCartFeedback(null), 1500);
                        }}
                        rankWeight={rd?.rankWeight}
                        rankScores={rd?.rankScores}
                        dominantReason={rd?.dominantReason}
                      />
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filtered.length > PER_PAGE && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 28 }}>
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t("common.previous")}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${colors.borderLight}`,
                background: colors.surface, color: safePage <= 1 ? colors.textMuted : colors.text,
                fontSize: 12, fontWeight: 500, cursor: safePage <= 1 ? "not-allowed" : "pointer",
                opacity: safePage <= 1 ? 0.35 : 1, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={(e) => { if (safePage > 1) e.currentTarget.style.background = colors.surfaceHover; }}
              onMouseLeave={(e) => { if (safePage > 1) e.currentTarget.style.background = colors.surface; }}
            >
              ← {t("common.previous")}
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const range = Math.min(totalPages, 7);
              const start = totalPages <= range ? 1 : Math.max(1, Math.min(safePage - Math.floor(range / 2), totalPages - range + 1));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === safePage ? "page" : undefined}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none",
                    background: p === safePage ? colors.accentGradient : "transparent",
                    color: p === safePage ? "#fff" : colors.textSecondary,
                    fontSize: 12, fontWeight: p === safePage ? 700 : 450, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (p !== safePage) e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.color = colors.text; }}
                  onMouseLeave={(e) => { if (p !== safePage) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.textSecondary; } }}
                >{p}</button>
              );
            })}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={t("common.next")}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${colors.borderLight}`,
                background: colors.surface, color: safePage >= totalPages ? colors.textMuted : colors.text,
                fontSize: 12, fontWeight: 500, cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                opacity: safePage >= totalPages ? 0.35 : 1, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={(e) => { if (safePage < totalPages) e.currentTarget.style.background = colors.surfaceHover; }}
              onMouseLeave={(e) => { if (safePage < totalPages) e.currentTarget.style.background = colors.surface; }}
            >
              {t("common.next")} →
            </button>
            <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4, whiteSpace: "nowrap" }}>
              {safePage}/{totalPages}
            </span>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState icon={<MagnifyingGlass size={48} />}
            title={t("lots.empty.title")}
            description={t("lots.empty.desc")}
            action={{ label: t("lots.empty.action"), onClick: () => { setSearch(""); setActiveFilters({}); } }} />
        )}
      </div>
    </FadeIn>
  );
}
