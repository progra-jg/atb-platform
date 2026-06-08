import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import {
  FileText, SealCheck, Clock, ArrowLeft, Plus, CheckCircle, Circle, Warning,
  Package, TrendUp, CalendarBlank, FloppyDisk, Handshake, Sparkle, MapPin, XCircle,
  User, NotePencil, PaperPlaneTilt, DownloadSimple, ChatCircleText, House,
  MagnifyingGlass, Stack, X, ListBullets, CopySimple, Archive, Funnel,
} from "@phosphor-icons/react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import {
  fetchContracts, fetchContractById, suggestPrice as apiSuggestPrice,
  createContract, signContract, negotiateContract, renewContract, updateContract,
  markDeliveryReceived, deleteContract, duplicateContract, getExportPdfUrl,
  markPaiementRegle,
  fetchFarmers,
} from "../services/contracts";
import type {
  FrameworkContract, ContractStatus, CounterOffer, DeliveryCalendarItem, PaiementItem, PriceSuggestion,
} from "../types/contract";
import type { FarmerRef } from "../services/contracts";
import { formatNumber, formatDate } from "../utils/format";

// ─── Helpers ──────────────────────────────────────────────
const fmt = (n: number) => formatNumber(n);
const progress = (c: FrameworkContract) => {
  const total = new Date(c.dateFin).getTime() - new Date(c.dateDebut).getTime();
  const elapsed = Date.now() - new Date(c.dateDebut).getTime();
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};
const daysLeft = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

const exportCSV = (contracts: FrameworkContract[], farmerMap: Record<string, FarmerRef>, t: (k: string) => string) => {
  const tCSV = (k: string) => t("contracts.csvHeaders." + k);
  const rows = contracts.map((c) => ({
    [tCSV("culture")]: c.culture,
    [tCSV("producer")]: farmerMap[c.producteurId]?.name || c.producteurId,
    [tCSV("village")]: farmerMap[c.producteurId]?.village || "",
    [tCSV("volume")]: Number(c.volumeKg),
    [tCSV("price")]: Number(c.prixKg),
    [tCSV("totalAmount")]: Number(c.montantTotal),
    [tCSV("status")]: c.statut,
    [tCSV("startDate")]: c.dateDebut,
    [tCSV("endDate")]: c.dateFin,
    [tCSV("signedBuyer")]: c.signatureBuyerAt ? formatDate(c.signatureBuyerAt) : "",
    [tCSV("signedProducer")]: c.signatureProducteurAt ? formatDate(c.signatureProducteurAt) : "",
    [tCSV("renewable")]: c.renouvelable ? t("common.yes") : t("common.no"),
    [tCSV("lotId")]: c.lotId || "",
    [tCSV("conditions")]: c.conditions || "",
  }));
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(";"),
    ...rows.map((r: Record<string, unknown>) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(";")),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `contrats-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

const STATUS_CFG: Record<string, { color: string; bg: string; icon: any; order: number }> = {
  brouillon:     { color: "#6b7280", bg: "#f3f4f6", icon: NotePencil,    order: 0 },
  envoye:        { color: "#2563eb", bg: "#dbeafe", icon: PaperPlaneTilt,order: 1 },
  en_negociation:{ color: "#d97706", bg: "#fef3c7", icon: Handshake,     order: 2 },
  signe:         { color: "#7c3aed", bg: "#ede9fe", icon: SealCheck,     order: 3 },
  actif:         { color: "#059669", bg: "#d1fae5", icon: TrendUp,       order: 4 },
  termine:       { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle,   order: 5 },
  resilie:       { color: "#dc2626", bg: "#fee2e2", icon: XCircle,       order: 6 },
};

const PIE_COLORS = ["#6b7280","#2563eb","#d97706","#7c3aed","#059669","#16a34a","#dc2626"];

function apiErrorToast(t: (k: string) => string, toast: (msg: string, type: "success" | "error") => void, e: any, fallback: string) {
  const msg = e?.response?.data?.message || fallback;
  const isConn = !e?.response && e?.code === "ERR_NETWORK";
  toast(isConn ? t("common.apiUnavailable") : msg, "error");
}

// ─── Inline Toast ─────────────────────────────────────────
function useInlineToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" }[]>([]);
  const add = (msg: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, add };
}

function ToastStack({ toasts }: { toasts: { id: number; msg: string; type: "success" | "error" }[] }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 6 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "success" ? "#16a34a" : "#dc2626", color: "#fff",
          padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          animation: "fadeSlideUp 0.25s ease",
          backdropFilter: "blur(8px)",
        }}>
          {t.type === "success" ? "✅ " : "⚠️ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── FadeIn ───────────────────────────────────────────────
function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
      {children}
    </div>
  );
}

// ─── DashboardView ────────────────────────────────────────
function DashboardView({ onNew }: { onNew: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", background: colors.inputBg, color: colors.text };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ["contracts"], queryFn: fetchContracts,
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: fetchFarmers,
  });
  const farmerMap = useMemo(() => {
    const m: Record<string, FarmerRef> = {};
    for (const f of farmers) m[f.id] = f;
    return m;
  }, [farmers]);

  const [filter, setFilter] = useState<ContractStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showArchives, setShowArchives] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [filterVolMin, setFilterVolMin] = useState("");
  const [filterVolMax, setFilterVolMax] = useState("");
  const [filterPrixMin, setFilterPrixMin] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [sortBy, setSortBy] = useState<"culture" | "dateFin" | "volumeKg" | "prixKg" | "montantTotal">("dateFin");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = contracts;
    if (filter !== "all") list = list.filter((c) => c.statut === filter);
    else if (!showArchives) list = list.filter((c) => c.statut !== "resilie");
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.culture.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s) ||
        (c.producteurId && farmerMap[c.producteurId]?.name?.toLowerCase().includes(s)) ||
        (c.producteurId && farmerMap[c.producteurId]?.village?.toLowerCase().includes(s))
      );
    }
    if (filterDateDebut) list = list.filter((c) => c.dateDebut >= filterDateDebut);
    if (filterDateFin) list = list.filter((c) => c.dateFin <= filterDateFin);
    if (filterVolMin) list = list.filter((c) => Number(c.volumeKg) >= Number(filterVolMin));
    if (filterVolMax) list = list.filter((c) => Number(c.volumeKg) <= Number(filterVolMax));
    if (filterPrixMin) list = list.filter((c) => Number(c.prixKg) >= Number(filterPrixMin));
    if (filterPrixMax) list = list.filter((c) => Number(c.prixKg) <= Number(filterPrixMax));
    list.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : Number(av) - Number(bv);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [contracts, filter, search, showArchives, filterDateDebut, filterDateFin, filterVolMin, filterVolMax, filterPrixMin, filterPrixMax, sortBy, sortAsc]);

  const archived = useMemo(() => contracts.filter((c) => c.statut === "resilie"), [contracts]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contracts.filter((x) => x.statut !== "resilie").length };
    for (const s of Object.keys(STATUS_CFG)) c[s] = contracts.filter((x) => x.statut === s).length;
    return c;
  }, [contracts]);

  const kpi = useMemo(() => {
    const actifs = contracts.filter((c) => c.statut === "actif");
    const signes = contracts.filter((c) => c.statut === "signe" || c.statut === "actif");
    return {
      actifs: actifs.length,
      volumeTotal: actifs.reduce((a, c) => a + Number(c.volumeKg), 0),
      montantTotal: actifs.reduce((a, c) => a + Number(c.montantTotal), 0),
      enRetard: actifs.filter((c) => daysLeft(c.dateFin) <= 0).length,
      signes: signes.length,
      total: contracts.length,
    };
  }, [contracts]);

  const pieData = useMemo(() =>
    Object.entries(STATUS_CFG).map(([k, v]) => ({
      name: t("contracts.status." + k), value: counts[k] || 0, color: v.color,
    })).filter((d) => d.value > 0),
    [counts, t]
  );

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of contracts) {
      if (c.statut === "actif" || c.statut === "signe" || c.statut === "termine") {
        map[c.culture] = (map[c.culture] || 0) + Number(c.volumeKg);
      }
    }
    return Object.entries(map).map(([culture, volume]) => ({ culture: culture.slice(0, 10), volume }));
  }, [contracts]);

  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const c of contracts) {
      const d = new Date(c.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[k] = (months[k] || 0) + 1;
    }
    return Object.entries(months).sort().slice(-6).map(([m, count]) => {
      const [y, mo] = m.split("-");
      return { month: `${mo}/${y!.slice(2)}`, count };
    });
  }, [contracts]);

  const topProducteurs = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    for (const c of contracts) {
      if (!c.producteurId) continue;
      if (!map[c.producteurId]) map[c.producteurId] = { count: 0, volume: 0 };
      map[c.producteurId].count++;
      map[c.producteurId].volume += Number(c.volumeKg);
    }
    return Object.entries(map)
      .map(([id, d]) => ({ id, name: farmerMap[id]?.name || id.slice(0, 8), village: farmerMap[id]?.village || "", ...d }))
      .sort((a, b) => b.count - a.count || b.volume - a.volume)
      .slice(0, 5);
  }, [contracts, farmerMap]);

  const successStats = useMemo(() => {
    const total = contracts.filter((c) => c.statut !== "brouillon").length;
    const success = contracts.filter((c) => c.statut === "actif" || c.statut === "termine").length;
    const failed = contracts.filter((c) => c.statut === "resilie").length;
    return { total, success, failed, rate: total ? Math.round((success / total) * 100) : 0 };
  }, [contracts]);

  if (isLoading) return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 8px", animation: "fadeSlideUp 0.25s ease" }}>
      <div style={{ height: 14, width: 160, background: colors.borderLight, borderRadius: 6, marginBottom: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 }}>
        {[1,2,3,4].map((i) => <div key={i} style={{ height: 72, background: colors.borderLight, borderRadius: 12, animation: "shimmer 1.2s ease infinite" }} />)}
      </div>
      <div style={{ height: 200, background: colors.borderLight, borderRadius: 12, animation: "shimmer 1.2s ease infinite" }} />
    </div>
  );

  if (isError) return (
    <FadeIn>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 8px", textAlign: "center", paddingTop: 80 }}>
        <Warning size={48} color="#dc2626" />
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginTop: 12 }}>{t("contracts.dashboardLoadError")}</div>
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, maxWidth: 320, margin: "8px auto 0" }}>
          {t("contracts.dashboardLoadErrorDesc")}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => window.location.reload()} style={{
            background: colors.accent, color: "#fff", border: "none", padding: "10px 24px",
            borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {t("common.retry")}
          </button>
          <button onClick={() => { qc.invalidateQueries({ queryKey: ["contracts"] }); }} style={{
            background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
            color: colors.text, padding: "10px 24px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {t("contracts.forceReload")}
          </button>
        </div>
      </div>
    </FadeIn>
  );

  return (
    <FadeIn>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 8px" }}>

        {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: colors.text }}>{t("contracts.title")}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{t("contracts.subtitle", { count: contracts.length, active: kpi.actifs })}</div>
          </div>
          <button onClick={onNew} style={{
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "#fff", border: "none",
            padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, boxShadow: `0 2px 12px ${colors.accent}44`,
          }}>
            <Plus size={15} /> {t("contracts.newContract")}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 14 }}>
          {[
            { icon: TrendUp, label: t("contracts.kpis.actifs"), value: `${kpi.actifs}`, sub: `${fmt(kpi.volumeTotal)} kg`, color: "#059669" },
            { icon: SealCheck, label: t("contracts.kpis.signes"), value: `${kpi.signes}`, sub: `${(kpi.montantTotal / 1e6).toFixed(1)}M ${t("common.currency")}`, color: "#7c3aed" },
            { icon: Package, label: t("contracts.kpis.volume"), value: `${fmt(kpi.volumeTotal)} kg`, sub: `${kpi.actifs} ${t("contracts.charts.contrat")}`, color: "#2563eb" },
            { icon: Clock, label: t("contracts.kpis.enRetard"), value: `${kpi.enRetard}`, sub: kpi.enRetard > 0 ? t("contracts.kpis.action") : t("contracts.kpis.aucun"), color: kpi.enRetard > 0 ? "#dc2626" : "#16a34a" },
          ].map((k) => (
            <div key={k.label} style={{
              background: colors.surface, borderRadius: 12, padding: "10px 12px",
              border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${k.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <k.icon size={13} color={k.color} />
                </div>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: colors.text }}>{k.value}</div>
              <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {/* Pie chart */}
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8 }}>{t("contracts.charts.repartition")}</div>
            {pieData.length === 0 ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: colors.textMuted }}>{t("common.noResults")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Bar chart */}
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8 }}>{t("contracts.charts.volumeCulture")}</div>
            {barData.length === 0 ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: colors.textMuted }}>{t("common.noResults")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData}>
                  <XAxis dataKey="culture" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trend + Producteurs row */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {/* Monthly trend */}
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8 }}>{t("contracts.charts.tendance")}</div>
            {trendData.length === 0 ? (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: colors.textMuted }}>{t("common.noResults")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={trendData}>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Top producteurs */}
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{t("contracts.charts.topProducteurs")}</div>
            {topProducteurs.length === 0 ? (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: colors.textMuted }}>{t("contracts.empty.subtitle")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {topProducteurs.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < topProducteurs.length - 1 ? `1px solid ${colors.borderLight}` : "none" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: i === 0 ? "#fef3c7" : i === 1 ? "#e5e7eb" : i === 2 ? "#fed7aa" : colors.borderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: i < 3 ? colors.text : colors.textMuted, flexShrink: 0 }}>{i + 1}</div>
                    <User size={10} style={{ flexShrink: 0, color: colors.textMuted }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      {p.village && <div style={{ fontSize: 8, color: colors.textMuted }}>{p.village}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: colors.text }}>{p.count} {t("contracts.charts.contrat")}</div>
                      <div style={{ fontSize: 8, color: colors.textMuted }}>{fmt(p.volume)} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Success rate */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>{t("contracts.charts.succes")}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: successStats.rate >= 70 ? "#16a34a" : successStats.rate >= 40 ? "#f59e0b" : "#dc2626" }}>{successStats.rate}%</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>{successStats.success} {t("contracts.charts.reussis")} · {successStats.failed} {t("contracts.charts.resilies")}</div>
          </div>
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>{t("contracts.charts.montantTotal")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{fmt(kpi.montantTotal)} FCFA</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>{t("contracts.charts.surActifs", { count: kpi.actifs })}</div>
          </div>
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>{t("contracts.charts.valeurMoyenne")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{kpi.actifs ? fmt(Math.round(kpi.montantTotal / kpi.actifs)) : "—"} FCFA</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>{t("contracts.charts.parContrat")}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", flexWrap: "nowrap" }}>
          {[
            { key: "all", label: t("contracts.kpis.actifs"), count: counts.all },
            ...Object.entries(STATUS_CFG).filter(([k]) => k !== "resilie").map(([k, v]) => ({ key: k, label: t("contracts.status." + k), count: counts[k] })),
          ].map((tab) => {
            const active = filter === tab.key;
            const cfg = tab.key === "all" ? { color: colors.accent, bg: colors.accentLight } : STATUS_CFG[tab.key];
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key as ContractStatus | "all")} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 8,
                border: active ? `1.5px solid ${cfg?.color || colors.accent}` : `1.5px solid ${colors.borderLight}`,
                cursor: "pointer", background: active ? `${cfg?.color || colors.accent}0a` : colors.surface,
                color: active ? cfg?.color || colors.accent : colors.textSecondary,
                fontSize: 11, fontWeight: active ? 600 : 500, whiteSpace: "nowrap",
              }}>
                {tab.key !== "all" && cfg && "icon" in cfg && (() => { const Icon = cfg.icon; return Icon ? <Icon size={12} /> : null; })()}
                {tab.label}
                <span style={{ fontSize: 9, background: colors.borderLight, padding: "1px 5px", borderRadius: 6 }}>{tab.count}</span>
              </button>
            );
          })}
          <button onClick={() => setShowArchives(!showArchives)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 8,
            border: showArchives ? `1.5px solid #dc2626` : `1.5px solid ${colors.borderLight}`,
            cursor: "pointer", background: showArchives ? "#fef2f2" : colors.surface,
            color: showArchives ? "#dc2626" : colors.textSecondary,
            fontSize: 11, fontWeight: showArchives ? 600 : 500, whiteSpace: "nowrap",
          }}>
            <Archive size={12} /> {t("contracts.archives")}
            <span style={{ fontSize: 9, background: colors.borderLight, padding: "1px 5px", borderRadius: 6 }}>{archived.length}</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MagnifyingGlass size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("contracts.search")}
              style={{
                width: "100%", padding: "7px 10px 7px 26px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = colors.accent; e.target.style.boxShadow = `0 0 0 2px ${colors.accent}22`; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: "7px 11px", borderRadius: 8, border: showFilters ? `1.5px solid ${colors.accent}` : `1.5px solid ${colors.borderLight}`,
            background: showFilters ? `${colors.accent}0a` : colors.surface, color: showFilters ? colors.accent : colors.textSecondary,
            cursor: "pointer", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          }}>
            <Funnel size={12} /> {t("contracts.filtersBtn")}
          </button>
          <button onClick={() => exportCSV(filtered, farmerMap, t)} style={{
            padding: "7px 11px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
            background: colors.surface, color: colors.textSecondary,
            cursor: "pointer", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          }}>
            <DownloadSimple size={12} /> CSV
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.dateDebut")}</label>
                <input type="date" value={filterDateDebut} onChange={(e) => setFilterDateDebut(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.dateFin")}</label>
                <input type="date" value={filterDateFin} onChange={(e) => setFilterDateFin(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.volMin")}</label>
                <input type="number" value={filterVolMin} onChange={(e) => setFilterVolMin(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.volMax")}</label>
                <input type="number" value={filterVolMax} onChange={(e) => setFilterVolMax(e.target.value)} placeholder="∞" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.prixMin")}</label>
                <input type="number" value={filterPrixMin} onChange={(e) => setFilterPrixMin(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>{t("contracts.filters.prixMax")}</label>
                <input type="number" value={filterPrixMax} onChange={(e) => setFilterPrixMax(e.target.value)} placeholder="∞" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{t("contracts.filters.trierPar")}</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{
                  padding: "4px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, background: colors.inputBg, color: colors.text,
                }}>
                  <option value="dateFin">{t("contracts.filters.dateFinLabel")}</option>
                  <option value="culture">{t("contracts.filters.culture")}</option>
                  <option value="volumeKg">{t("contracts.filters.volume")}</option>
                  <option value="prixKg">{t("contracts.filters.prix")}</option>
                  <option value="montantTotal">{t("contracts.filters.montant")}</option>
                </select>
                <button onClick={() => setSortAsc(!sortAsc)} style={{
                  padding: "4px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, background: colors.surface, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: colors.text,
                }}>
                  <ArrowLeft size={11} style={{ transform: sortAsc ? "rotate(90deg)" : "rotate(-90deg)" }} />
                  {sortAsc ? t("contracts.filters.croissant") : t("contracts.filters.decroissant")}
                </button>
              </div>
              <button onClick={() => { setFilterDateDebut(""); setFilterDateFin(""); setFilterVolMin(""); setFilterVolMax(""); setFilterPrixMin(""); setFilterPrixMax(""); setSortBy("dateFin"); setSortAsc(false); }} style={{
                padding: "4px 10px", borderRadius: 6, border: "none", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 10, fontWeight: 500,
              }}>
                {t("contracts.filters.reinitialiser")}
              </button>
            </div>
          </div>
        )}

        {/* Contract list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: colors.surface, borderRadius: 12, border: `1.5px solid ${colors.borderLight}` }}>
            <FileText size={36} style={{ opacity: 0.2, color: colors.textMuted }} />
            <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
              {search || filter !== "all" ? t("contracts.empty.title") : t("contracts.empty.subtitle")}
            </div>
            {!search && filter === "all" && (
              <button onClick={onNew} style={{ marginTop: 10, background: colors.accent, color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {t("contracts.create")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((c, idx) => {
              const cfg = STATUS_CFG[c.statut] || STATUS_CFG.brouillon;
              const SI = cfg.icon;
              const pct = progress(c);
              const dl = daysLeft(c.dateFin);
              return (
                <div key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} style={{
                  background: colors.surface, borderRadius: 12, padding: "10px 12px",
                  border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm,
                  cursor: "pointer", display: "flex", flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center", gap: 8,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  animation: "fadeSlideUp 0.25s ease",
                  animationDelay: `${idx * 0.04}s`,
                  animationFillMode: "backwards",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.boxShadow = colors.shadowSm; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cfg.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SI size={16} color={cfg.color} />
                  </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{tCrop(c.culture)}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{t("contracts.status." + c.statut)}</span>
                      {c.renouvelable && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 8, background: "#fef3c7", color: "#d97706" }}>♻️</span>}
                    </div>
                    {c.producteurId && farmerMap[c.producteurId] && (
                      <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        <User size={9} /> {farmerMap[c.producteurId].name} — {farmerMap[c.producteurId].village}
                      </div>
                    )}
              <div style={{ display: "flex", gap: 12, fontSize: 10, color: colors.textMuted }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Package size={9} /> {fmt(Number(c.volumeKg))} kg</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><TrendUp size={9} /> {fmt(Number(c.prixKg))} {t("common.currency")}/kg</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><CalendarBlank size={9} /> {formatDate(c.dateFin)}</span>
                      </div>
                    {(c.statut === "actif" || c.statut === "signe") && (
                      <div style={{ marginTop: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 8, color: dl > 0 ? colors.textMuted : "#dc2626" }}>{dl > 0 ? `${dl}${t("contracts.detail.joursRestants")}` : t("contracts.detail.depasse")}</span>
                          <span style={{ fontSize: 8, color: colors.textMuted }}>{pct}%</span>
                        </div>
                        <div style={{ height: 3, background: colors.borderLight, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : colors.accent, borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                    {c.signatureBuyerAt && <CheckCircle size={12} color="#16a34a" weight="fill" />}
                    {c.counterOffers && c.counterOffers.length > 0 && (
                      <span style={{ fontSize: 9, background: "#fef3c7", padding: "1px 5px", borderRadius: 6, color: "#d97706", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                        <ChatCircleText size={9} />{c.counterOffers.length}
                      </span>
                    )}
                    <ArrowLeft size={12} color={colors.textMuted} style={{ transform: "rotate(180deg)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Archived contracts */}
        {showArchives && archived.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Archive size={13} color="#dc2626" /> Archives ({archived.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {archived.map((c, idx) => {
                const cfg = STATUS_CFG.resilie;
                const SI = cfg.icon;
                return (
                  <div key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} style={{
                    background: colors.surface, borderRadius: 12, padding: "10px 12px",
                    border: "1.5px solid #fecaca", boxShadow: colors.shadowSm,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    opacity: 0.75, transition: "opacity 0.15s, border-color 0.15s",
                    animation: "fadeSlideUp 0.25s ease",
                    animationDelay: `${idx * 0.04}s`,
                    animationFillMode: "backwards",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "#dc2626"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.borderColor = "#fecaca"; }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cfg.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SI size={16} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{tCrop(c.culture)}</span>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{t("contracts.status." + c.statut)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 10, color: colors.textMuted }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Package size={9} /> {fmt(Number(c.volumeKg))} kg</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><TrendUp size={9} /> {fmt(Number(c.prixKg))} {t("common.currency")}/kg</span>
                      </div>
                    </div>
                    <ArrowLeft size={12} color={colors.textMuted} style={{ transform: "rotate(180deg)" }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

// ─── CreateWizard ────────────────────────────────────────
function CreateWizard({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toasts, add: toast } = useInlineToast();
  const [step, setStep] = useState(0);
  const [culture, setCulture] = useState("");
  const [producteurId, setProducteurId] = useState("");
  const [lotId, setLotId] = useState("");
  const [volume, setVolume] = useState("");
  const [prix, setPrix] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [conditions, setConditions] = useState("");
  const [renouvelable, setRenouvelable] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  // Available lots
  const { data: lots = [] } = useQuery({
    queryKey: ["lots"],
    queryFn: async () => {
      const axios = (await import("axios")).default;
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const { data } = await axios.get(`${baseUrl}/lots`, { params: { statut: "disponible" } });
      return data;
    },
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: fetchFarmers,
  });
  const farmerMap = useMemo(() => {
    const m: Record<string, FarmerRef> = {};
    for (const f of farmers) m[f.id] = f;
    return m;
  }, [farmers]);

  const cultureRef = useRef(culture);
  cultureRef.current = culture;
  const prevCulture = useRef("");

  useEffect(() => {
    if (culture && culture !== prevCulture.current) {
      prevCulture.current = culture;
      setSuggesting(true);
      apiSuggestPrice(culture)
        .then((s) => setPriceSuggestion(s))
        .catch(() => setPriceSuggestion(null))
        .finally(() => setSuggesting(false));
    }
  }, [culture]);

  useEffect(() => {
    if (!dateDebut && !dateFin) {
      const start = new Date();
      setDateDebut(start.toISOString().split("T")[0]);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      setDateFin(end.toISOString().split("T")[0]);
    }
  }, []);

  const montantTotal = Number(volume) * Number(prix) || 0;

  const createMut = useMutation({
    mutationFn: () => createContract({
      producteurId: producteurId || "p0000000-0001-4000-8000-000000000001",
      culture, volumeKg: Number(volume), prixKg: Number(prix),
      dateDebut, dateFin, conditions: conditions || undefined,
      renouvelable, lotId: lotId || undefined,
    }),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast(t("contracts.create") + " !", "success"); navigate(`/contracts/${d.id}`); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de création"),
  });

  const steps = [t("contracts.createWizard.steps.produit"), t("contracts.createWizard.steps.volumePrix"), t("contracts.createWizard.steps.duree"), t("contracts.createWizard.steps.revision")];
  const canNext = () => {
    if (step === 0) return !!culture;
    if (step === 1) return !!volume && !!prix && Number(volume) > 0 && Number(prix) > 0;
    if (step === 2) return !!dateDebut && !!dateFin && new Date(dateFin) > new Date(dateDebut);
    return true;
  };

  const cultures = ["Cacao", "Café", "Maïs", "Riz", "Soja", "Banane", "Ananas", "Manioc", "Arachide", "Sésame"];

  const selectedLot = lots.find((l: any) => l.id === lotId);

  return (
    <FadeIn>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 8px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: colors.accent, cursor: "pointer",
          fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginBottom: 12, padding: 0,
        }}>
          <ArrowLeft size={14} /> {t("common.back")}
        </button>

        {/* Stepper */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, alignItems: "flex-start" }}>
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                <div style={{
                  height: 3, borderRadius: 2, marginBottom: 6,
                  background: done ? "#16a34a" : active ? `linear-gradient(90deg, ${colors.accent}, #34d399)` : colors.borderLight,
                  transition: "background 0.3s",
                }} />
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", margin: "0 auto 4px",
                  background: done ? "#16a34a" : active ? colors.accent : colors.borderLight,
                  color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: "18px",
                  transition: "all 0.3s",
                }}>{i + 1}</div>
                <div style={{
                  fontSize: 9, fontWeight: active ? 600 : 400,
                  color: done ? "#16a34a" : active ? colors.accent : colors.textMuted,
                }}>{s}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: colors.surface, borderRadius: 14, padding: 14, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowMd, animation: "fadeSlideUp 0.3s ease" }}>

          {/* Step 0: Produit */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                <span style={{ color: colors.accent }}>1.</span> {t("contracts.stepHeadingProduct")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {cultures.map((c) => {
                  const sel = culture === c;
                  return (
                    <button key={c} onClick={() => setCulture(c)} style={{
                      padding: "7px 0", borderRadius: 8, border: sel ? `2px solid ${colors.accent}` : `1.5px solid ${colors.borderLight}`,
                      background: sel ? `${colors.accent}0a` : colors.statBg, cursor: "pointer",
                      fontSize: 11, fontWeight: sel ? 600 : 500, color: sel ? colors.accent : colors.text,
                      transition: "all 0.15s",
                    }}>{c}</button>
                  );
                })}
              </div>
              {/* Farmer selector */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 4 }}>{t("contracts.wizardFarmerOptional")}</div>
                <select value={producteurId} onChange={(e) => {
                  const pid = e.target.value;
                  setProducteurId(pid);
                  if (pid) setCulture(farmerMap[pid]?.village ? culture : culture);
                }} style={{
                  width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`,
                  fontSize: 11, background: colors.inputBg, color: colors.text,
                }}>
                  <option value="">{t("contracts.wizardNoFarmer")}</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} — {f.village} ({f.cooperative})</option>
                  ))}
                </select>
              </div>
              {/* Lot selector */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 4 }}>{t("contracts.wizardLotOptional")}</div>
                <select value={lotId} onChange={(e) => {
                  const lid = e.target.value;
                  setLotId(lid);
                  const lot = lots.find((l: any) => l.id === lid);
                  if (lot) {
                    setCulture(lot.culture || culture);
                    setProducteurId(lot.producteurId || "");
                    if (lot.volumeKg) setVolume(String(lot.volumeKg));
                  }
                }} style={{
                  width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`,
                  fontSize: 11, background: colors.inputBg, color: colors.text,
                }}>
                  <option value="">{t("contracts.wizardNoLot")}</option>
                  {lots.filter((l: any) => !producteurId || l.producteurId === producteurId).map((l: any) => (
                    <option key={l.id} value={l.id}>{tCrop(l.culture)} — {fmt(Number(l.volumeKg) || 0)} kg</option>
                  ))}
                </select>
              </div>
              {selectedLot && (() => {
                const pf = farmerMap[selectedLot.producteurId || ""];
                return (
                  <div style={{ fontSize: 10, color: colors.textMuted, background: colors.statBg, borderRadius: 6, padding: "6px 8px" }}>
                    <MapPin size={10} /> {selectedLot.localisation || t("contracts.unknownLocation")} · {pf ? `${pf.name} (${pf.village})` : `ID: ${selectedLot.producteurId?.slice(0, 8)}`}
                  </div>
                );
              })()}
              {producteurId && !selectedLot && farmerMap[producteurId] && (
                <div style={{ fontSize: 10, color: colors.textMuted, background: colors.statBg, borderRadius: 6, padding: "6px 8px", marginTop: 4 }}>
                  <User size={10} /> {farmerMap[producteurId].name} — {farmerMap[producteurId].village} ({farmerMap[producteurId].cooperative})
                </div>
              )}
            </div>
          )}

          {/* Step 1: Volume & Prix */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                <span style={{ color: colors.accent }}>2.</span> {t("contracts.stepHeadingVolumePrice")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: colors.textMuted, display: "block", marginBottom: 3 }}>{t("contracts.volume")}</label>
                  <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} min={1}
                    style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: colors.textMuted, display: "block", marginBottom: 3 }}>{t("contracts.price")}</label>
                  <div style={{ position: "relative" }}>
                    <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} min={1}
                      style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                  </div>
                </div>
              </div>
              {/* Price suggestion */}
              {culture && (
                <div style={{ background: colors.statBg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted }}>{t("contracts.marketPriceFor", { culture })}</span>
                    {suggesting ? (
                      <span style={{ fontSize: 9, color: colors.textMuted }}>{t("contracts.calculating")}</span>
                    ) : priceSuggestion?.avg ? (
                      <button onClick={() => setPrix(String(priceSuggestion.avg))} style={{
                        background: colors.accent, color: "#fff", border: "none", padding: "3px 10px", borderRadius: 5,
                        fontSize: 9, fontWeight: 600, cursor: "pointer",
                      }}>{t("contracts.applyPrice", { price: fmt(priceSuggestion.avg) })}</button>
                    ) : null}
                  </div>
                  {suggesting ? (
                    <div style={{ height: 4, background: colors.borderLight, borderRadius: 2 }}>
                      <div style={{ width: "40%", height: "100%", background: colors.accent, borderRadius: 2, animation: "shimmer 1.2s ease infinite" }} />
                    </div>
                  ) : priceSuggestion?.avg ? (
                    <div style={{ display: "flex", gap: 10, fontSize: 10, color: colors.textSecondary }}>
                      <span>{t("common.avg")}: <strong>{fmt(priceSuggestion.avg)}</strong></span>
                      <span>{t("common.min")}: <strong>{fmt(priceSuggestion.min || 0)}</strong></span>
                      <span>{t("common.max")}: <strong>{fmt(priceSuggestion.max || 0)}</strong></span>
                      <span style={{ color: colors.textMuted }}>{t("contracts.readings", { count: priceSuggestion.count })}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: colors.textMuted }}>{t("contracts.noMarketData")}</div>
                  )}
                </div>
              )}
              {/* Montant */}
              {montantTotal > 0 && (
                <div style={{             background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, borderRadius: 8, padding: "7px 10px", color: "#fff", boxShadow: `0 2px 12px ${colors.accent}33` }}>
                  <div style={{ fontSize: 9, opacity: 0.8 }}>{t("contracts.estimatedTotal")}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(montantTotal)} {t("common.currency")}</div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Durée */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                <span style={{ color: colors.accent }}>3.</span> {t("contracts.stepHeadingDuration")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: colors.textMuted, display: "block", marginBottom: 3 }}>{t("contracts.createWizard.dateDebut")}</label>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                    style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: colors.textMuted, display: "block", marginBottom: 3 }}>{t("contracts.createWizard.dateFin")}</label>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                    style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                </div>
              </div>
              {dateDebut && dateFin && new Date(dateFin) > new Date(dateDebut) && (
                <div style={{ background: colors.statBg, borderRadius: 8, padding: "6px 8px", fontSize: 10, color: colors.textSecondary }}>
                  {t("contracts.durationValue", { days: Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000) })}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <input type="checkbox" id="renouv" checked={renouvelable} onChange={(e) => setRenouvelable(e.target.checked)}
                  style={{ accentColor: colors.accent }} />
                <label htmlFor="renouv" style={{ fontSize: 10, color: colors.textSecondary }}>{t("contracts.createWizard.renouvelable")}</label>
              </div>
            </div>
          )}

          {/* Step 3: Révision */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                <span style={{ color: colors.accent }}>4.</span> {t("contracts.stepHeadingReview")}
              </div>
              <div style={{ background: colors.statBg, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                {[
                  { label: "Produit", value: culture },
                  { label: "Volume", value: `${fmt(Number(volume))} kg` },
                  { label: "Prix", value: `${fmt(Number(prix))} FCFA/kg` },
                  { label: "Montant", value: `${fmt(montantTotal)} FCFA` },
                  { label: "Début", value: formatDate(dateDebut) },
                  { label: "Fin", value: formatDate(dateFin) },
                  { label: "Renouvelable", value: renouvelable ? "Oui" : "Non" },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLight}`, fontSize: 11 }}>
                    <span style={{ color: colors.textMuted }}>{r.label}</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <textarea value={conditions} onChange={(e) => setConditions(e.target.value)}
                placeholder="Conditions particulières (optionnel)"
                rows={3}
                style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 11, boxSizing: "border-box", background: colors.inputBg, color: colors.text, resize: "vertical" }} />
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} style={{
                padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                background: colors.surface, color: colors.text, fontSize: 11, fontWeight: 500, cursor: "pointer",
              }}>
                <ArrowLeft size={12} /> Précédent
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: canNext() ? colors.accent : colors.borderLight,
                color: canNext() ? "#fff" : colors.textMuted, fontSize: 11, fontWeight: 600, cursor: canNext() ? "pointer" : "default",
              }}>
                Suivant <ArrowLeft size={12} style={{ transform: "rotate(180deg)" }} />
              </button>
            ) : (
              <button onClick={() => createMut.mutate()} disabled={createMut.isPending} style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: createMut.isPending ? colors.borderLight : `linear-gradient(135deg, ${colors.accent}, #34d399)`,
                color: createMut.isPending ? colors.textMuted : "#fff", fontSize: 11, fontWeight: 600,
                cursor: createMut.isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4,
              }}>
                {createMut.isPending ? "Création..." : <><FloppyDisk size={12} /> Créer le contrat</>}
              </button>
            )}
          </div>
        </div>
        <ToastStack toasts={toasts} />
      </div>
    </FadeIn>
  );
}

// ─── ContractDetail ───────────────────────────────────────
function ContractDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toasts, add: toast } = useInlineToast();
  const [tab, setTab] = useState("apercu");
  const [showSign, setShowSign] = useState(false);
  const [showNeg, setShowNeg] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVol, setEditVol] = useState("");
  const [editPrix, setEditPrix] = useState("");
  const [negP, setNegP] = useState(0);
  const [negV, setNegV] = useState(0);
  const [negM, setNegM] = useState("");

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ["contract", id], queryFn: () => fetchContractById(id), enabled: !!id,
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: fetchFarmers,
  });
  const farmerMap = useMemo(() => {
    const m: Record<string, FarmerRef> = {};
    for (const f of farmers) m[f.id] = f;
    return m;
  }, [farmers]);

  const signMut = useMutation({
    mutationFn: () => signContract(id, "buyer"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); qc.invalidateQueries({ queryKey: ["contracts"] }); setShowSign(false); toast(t("contracts.detail.chronologie.signeAcheteur") + " !", "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de signature"),
  });

  const simProdSignMut = useMutation({
    mutationFn: () => signContract(id, "producteur"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); qc.invalidateQueries({ queryKey: ["contracts"] }); toast(t("contracts.detail.chronologie.signeProducteur") + " !", "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de simulation"),
  });

  const negMut = useMutation({
    mutationFn: () => negotiateContract(id, { role: "buyer", prixKg: Number(negP), volumeKg: Number(negV), message: negM }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); setShowNeg(false); toast(t("contracts.counterOffer") + " envoyée", "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur d'envoi"),
  });

  const renewMut = useMutation({
    mutationFn: () => renewContract(id),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["contracts"] }); navigate(`/contracts/${d.id}`); toast(t("common.renew") + "é !", "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de renouvellement"),
  });

  const sendMut = useMutation({
    mutationFn: () => updateContract(id, { statut: "envoye" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); toast(t("contracts.detail.chronologie.envoye"), "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur d'envoi"),
  });

  const cancelMut = useMutation({
    mutationFn: () => updateContract(id, { statut: "resilie" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); qc.invalidateQueries({ queryKey: ["contracts"] }); setShowCancel(false); toast(t("contracts.detail.chronologie.resilie"), "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de résiliation"),
  });

  const deliverMut = useMutation({
    mutationFn: (index: number) => markDeliveryReceived(id, index),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); toast(t("contracts.detail.livraisons.marquerRecu"), "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur"),
  });

  const paiementMut = useMutation({
    mutationFn: (index: number) => markPaiementRegle(id, index),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); toast(t("contracts.detail.paiements.marquerRegle"), "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteContract(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast(t("common.delete") + "é", "success"); navigate("/contracts"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de suppression"),
  });

  const duplicateMut = useMutation({
    mutationFn: () => duplicateContract(id),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast(t("contracts.detail.actions.dupliquer"), "success"); navigate(`/contracts/${d.id}`); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de duplication"),
  });

  const saveEditMut = useMutation({
    mutationFn: () => updateContract(id, { volumeKg: Number(editVol), prixKg: Number(editPrix) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract", id] }); setIsEditing(false); toast(t("contracts.detail.brouillon"), "success"); },
    onError: (e: any) => apiErrorToast(t, toast, e, "Erreur de modification"),
  });

  useEffect(() => {
    if (c) { setNegP(Number(c.prixKg)); setNegV(Number(c.volumeKg)); setEditVol(String(c.volumeKg)); setEditPrix(String(c.prixKg)); }
  }, [c]);

  if (isLoading) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 8px", animation: "fadeSlideUp 0.25s ease" }}>
      <div style={{ height: 12, width: 100, background: colors.borderLight, borderRadius: 6, marginBottom: 14 }} />
      <div style={{ height: 260, background: colors.borderLight, borderRadius: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        {[1,2,3,4].map((i) => <div key={i} style={{ height: 60, background: colors.borderLight, borderRadius: 10, animation: "shimmer 1.2s ease infinite" }} />)}
      </div>
    </div>
  );

  if (isError || !c) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <Warning size={40} style={{ opacity: 0.3, color: colors.textMuted }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginTop: 8 }}>{t("contracts.detail.erreurChargement")}</div>
      <button onClick={onBack} style={{ marginTop: 10, background: colors.accent, color: "#fff", border: "none", padding: "8px 22px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t("common.back")}</button>
    </div>
  );

  const cfg = STATUS_CFG[c.statut] || STATUS_CFG.brouillon;
  const SI = cfg.icon;
  const pct = progress(c);
  const dl = daysLeft(c.dateFin);
  const canSign = !c.signatureBuyerAt && ["brouillon", "envoye", "en_negociation", "signe"].includes(c.statut);
  const signedBoth = !!c.signatureBuyerAt && !!c.signatureProducteurAt;
  const canNeg = ["brouillon", "envoye", "en_negociation"].includes(c.statut);
  const canSend = c.statut === "brouillon" || c.statut === "en_negociation";
  const canRenew = (c.statut === "termine" || (c.statut === "actif" && dl <= 30)) && signedBoth;
  const canResilier = ["envoye", "signe", "actif", "en_negociation"].includes(c.statut);
  const canEdit = c.statut === "brouillon";

  const TABS = [
    { key: "apercu", label: t("contracts.detail.tabs.apercu"), icon: FileText },
    { key: "livraisons", label: t("contracts.detail.tabs.livraisons"), icon: CalendarBlank, badge: c.calendrierLivraisons?.length || 0 },
    { key: "paiements", label: t("contracts.detail.tabs.paiements"), icon: SealCheck, badge: c.paiements?.filter((p) => p.statut !== "payé").length || 0 },
    { key: "negociation", label: t("contracts.detail.tabs.negociation"), icon: Handshake, badge: c.counterOffers?.length || 0 },
    { key: "activite", label: t("contracts.detail.tabs.activite"), icon: Clock },
  ];

  const exportPdf = () => {
    const url = getExportPdfUrl(c.id, i18n.language);
    window.open(url, "_blank");
  };

  return (
    <FadeIn>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 8px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: colors.accent, cursor: "pointer",
          fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginBottom: 10, padding: 0,
        }}>
          <ArrowLeft size={14} /> Retour
        </button>

        {/* Hero header */}
        <div style={{ background: colors.surface, borderRadius: 14, padding: isMobile ? 14 : 18, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowMd, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cfg.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SI size={17} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: colors.text }}>{tCrop(c.culture)}</div>
                <div style={{ fontSize: 9, color: colors.textMuted, fontFamily: "monospace" }}>{c.id}</div>
                {c.producteurId && farmerMap[c.producteurId] && (
                  <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <User size={10} /> {farmerMap[c.producteurId].name}
                    <span style={{ color: colors.textMuted }}>— {farmerMap[c.producteurId].village}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, padding: "2px 9px", borderRadius: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{t("contracts.status." + c.statut)}</span>
              {c.renouvelable && <span style={{ fontSize: 9, padding: "2px 9px", borderRadius: 12, fontWeight: 600, background: "#fef3c7", color: "#d97706" }}>{t("contracts.renewableBadge")}</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
            {[
              { icon: Package, label: t("contracts.detail.volume"), value: `${fmt(Number(c.volumeKg))} kg`, color: "#2563eb" },
              { icon: TrendUp, label: t("contracts.detail.prix"), value: `${fmt(Number(c.prixKg))} ${t("common.currency")}/kg`, color: "#059669" },
              { icon: FileText, label: t("contracts.detail.montant"), value: `${(Number(c.montantTotal) / 1e6).toFixed(1)}M`, color: "#7c3aed" },
              { icon: CalendarBlank, label: t("contracts.detail.echeance"), value: formatDate(c.dateFin), color: "#d97706" },
            ].map((k) => (
              <div key={k.label} style={{ background: colors.statBg, borderRadius: 6, padding: "6px 8px", borderLeft: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 9, color: colors.textMuted, display: "flex", alignItems: "center", gap: 2, marginBottom: 1 }}>
                  <k.icon size={9} color={k.color} /> {k.label}
                </div>
                <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: colors.text }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Archived banner */}
        {c.statut === "resilie" && (
          <div style={{ background: "#fef2f2", borderRadius: 10, padding: "8px 12px", border: "1.5px solid #fecaca", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Archive size={14} color="#dc2626" />
            <div style={{ fontSize: 10, color: "#991b1b", lineHeight: 1.4 }}>
              Contrat résilié. Il est conservé dans les archives à titre informatif.
            </div>
          </div>
        )}

        {/* Execution bar */}
        {signedBoth && c.statut !== "termine" && c.statut !== "resilie" && (
          <div style={{ background: colors.surface, borderRadius: 10, padding: "8px 12px", border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 4 }}>
                <TrendUp size={12} color={colors.accent} /> Exécution
              </span>
              <span style={{ fontSize: 9, color: dl > 0 ? colors.textMuted : "#dc2626" }}>{dl > 0 ? `${dl} jours restants` : "Échéance dépassée"}</span>
            </div>
            <div style={{ height: 5, background: colors.borderLight, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : colors.accent, borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
              <span>{formatDate(c.dateDebut)}</span>
              <span>{pct}%</span>
              <span>{formatDate(c.dateFin)}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8,
                border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: active ? colors.accent : colors.statBg,
                color: active ? "#fff" : colors.textSecondary,
                fontSize: 10, fontWeight: active ? 600 : 500,
              }}>
                <t.icon size={12} />
                {t.label}
                {(t.badge || 0) > 0 && <span style={{ fontSize: 8, background: "rgba(255,255,255,0.2)", padding: "1px 5px", borderRadius: 6 }}>{t.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Aperçu ── */}
        {tab === "apercu" && (
          <div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <SealCheck size={13} color={colors.accent} /> Signatures
              </div>
              {[
                { party: "Acheteur (vous)", signed: !!c.signatureBuyerAt, date: c.signatureBuyerAt, onClick: canSign ? () => setShowSign(true) : undefined },
                { party: farmerMap[c.producteurId] ? `${farmerMap[c.producteurId].name} (Producteur)` : "Producteur", signed: !!c.signatureProducteurAt, date: c.signatureProducteurAt },
              ].map((s) => (
                <div key={s.party} onClick={s.onClick} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", borderRadius: 6,
                  background: colors.statBg, marginBottom: 3,
                  cursor: s.onClick ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => { if (s.onClick) e.currentTarget.style.background = `${colors.accent}0a`; }}
                  onMouseLeave={(e) => { if (s.onClick) e.currentTarget.style.background = colors.statBg; }}>
                  {s.signed ? <CheckCircle size={14} color="#16a34a" weight="fill" /> : <Circle size={14} color={colors.textMuted} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: colors.text }}>{s.party}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted }}>
                      {s.signed && s.date ? `Signé le ${formatDate(s.date, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : s.onClick ? "Cliquez pour signer →" : "En attente"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {c.conditions && (
              <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 5 }}>Conditions</div>
                <div style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.conditions}</div>
              </div>
            )}
            {isEditing && (
              <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <NotePencil size={13} /> Modifier le contrat
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>Volume (kg)</label>
                    <input type="number" value={editVol} onChange={(e) => setEditVol(e.target.value)} min={1}
                      style={{ width: "100%", padding: "6px 7px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>Prix (FCFA/kg)</label>
                    <input type="number" value={editPrix} onChange={(e) => setEditPrix(e.target.value)} min={1}
                      style={{ width: "100%", padding: "6px 7px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setIsEditing(false)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`,
                    cursor: "pointer", background: colors.surface, color: colors.text, fontSize: 10, fontWeight: 500,
                  }}>
                    Annuler
                  </button>
                  <button onClick={() => saveEditMut.mutate()} disabled={saveEditMut.isPending} style={{
                    flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer",
                    background: colors.accent, color: "#fff", fontSize: 10, fontWeight: 600,
                    opacity: saveEditMut.isPending ? 0.6 : 1,
                  }}>
                    {saveEditMut.isPending ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </div>
            )}
            {/* Simulation producteur */}
            {c.statut === "envoye" && !c.signatureProducteurAt && (
              <div style={{ background: `${colors.accent}08`, borderRadius: 12, padding: 12, border: `1.5px dashed ${colors.accent}`, marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} color={colors.accent} /> En attente du producteur
                </div>
                <div style={{ fontSize: 9, color: colors.textMuted, lineHeight: 1.5, marginBottom: 8 }}>
                  Le contrat a été envoyé à {farmerMap[c.producteurId]?.name || "au producteur"}. 
                  En environnement de démonstration, tu peux simuler sa réponse :
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => simProdSignMut.mutate()} disabled={simProdSignMut.isPending} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    opacity: signMut.isPending ? 0.6 : 1,
                  }}>
                    <CheckCircle size={12} /> Simuler l'acceptation
                  </button>
                  <button onClick={() => setTab("negociation")} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                    cursor: "pointer", background: colors.surface, color: colors.textSecondary,
                    fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    <Handshake size={12} /> Simuler une contre-offre
                  </button>
                </div>
              </div>
            )}
            {c.statut === "envoye" && c.signatureProducteurAt && !c.signatureBuyerAt && (
              <div style={{ background: "#dcfce7", borderRadius: 12, padding: 12, border: "1.5px solid #86efac", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={14} color="#16a34a" weight="fill" />
                <div style={{ fontSize: 10, color: "#166534" }}>
                  {farmerMap[c.producteurId]?.name || "Le producteur"} a accepté le contrat ! <strong>Signe-le maintenant</strong> ci-dessus.
                </div>
              </div>
            )}
            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {canSend && (
                <button onClick={() => sendMut.mutate()} disabled={sendMut.isPending} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: colors.accent, color: "#fff", fontSize: 11, fontWeight: 600, minWidth: 120,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: sendMut.isPending ? 0.6 : 1,
                }}>
                  <PaperPlaneTilt size={12} /> Envoyer au producteur
                </button>
              )}
              {canSign && (
                <button onClick={() => setShowSign(true)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "#fff", fontSize: 11, fontWeight: 600, minWidth: 100,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <SealCheck size={13} /> Signer
                </button>
              )}
              {canNeg && (
                <button onClick={() => setTab("negociation")} style={{
                  flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${colors.accent}`,
                  cursor: "pointer", background: colors.accentLight, color: colors.accent, fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Handshake size={12} /> Négocier
                </button>
              )}
              {canRenew && (
                <button onClick={() => renewMut.mutate()} disabled={renewMut.isPending} style={{
                  flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                  cursor: "pointer", background: colors.surface, color: colors.text, fontSize: 11, fontWeight: 600,
                }}>
                  <Sparkle size={12} /> Renouveler
                </button>
              )}
              <button onClick={exportPdf} style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                cursor: "pointer", background: colors.surface, color: colors.textSecondary, fontSize: 11, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <DownloadSimple size={12} /> Export
              </button>
                <button onClick={() => duplicateMut.mutate()} disabled={duplicateMut.isPending} style={{
                  flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${colors.accent}`,
                  cursor: "pointer", background: colors.accentLight, color: colors.accent, fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4, opacity: duplicateMut.isPending ? 0.6 : 1,
                }}>
                  <CopySimple size={12} /> Dupliquer
                </button>
                {canResilier && (
                  <button onClick={() => setShowCancel(true)} style={{
                    flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: "1.5px solid #dc2626",
                    cursor: "pointer", background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    Résilier
                  </button>
                )}
                {canEdit && !isEditing && (
                  <button onClick={() => setIsEditing(true)} style={{
                    flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${colors.accent}`,
                    cursor: "pointer", background: colors.accentLight, color: colors.accent, fontSize: 11, fontWeight: 600,
                  }}>
                    <NotePencil size={12} /> Modifier
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => setShowDelete(true)} style={{
                    flex: "0 0 auto", padding: "8px 14px", borderRadius: 8, border: "1.5px solid #dc2626",
                    cursor: "pointer", background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 600,
                  }}>
                    Supprimer
                  </button>
                )}
            </div>
          </div>
        )}

        {/* ── Tab: Livraisons ── */}
        {tab === "livraisons" && (
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Calendrier des livraisons</div>
            {(!c.calendrierLivraisons || c.calendrierLivraisons.length === 0) ? (
              <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", padding: 16 }}>
                Le calendrier sera généré automatiquement après la signature complète.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {c.calendrierLivraisons.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6,
                    background: d.statut === "livré" ? "#dcfce7" : colors.statBg,
                    borderLeft: `3px solid ${d.statut === "livré" ? "#16a34a" : colors.borderLight}`,
                    animation: "fadeSlideUp 0.25s ease",
                    animationDelay: `${i * 0.04}s`,
                    animationFillMode: "backwards",
                  }}>
                    <div style={{ minWidth: 76, fontSize: 9, color: colors.text, fontWeight: 500 }}>
                      {formatDate(d.date, { month: "short", year: "numeric" })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 4, background: colors.borderLight, borderRadius: 2 }}>
                        <div style={{ width: d.statut === "livré" ? "100%" : "0%", height: "100%", background: "#16a34a", borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: colors.text, minWidth: 50, textAlign: "right" }}>{formatNumber(Number(d.volume))} kg</div>
                    {d.statut === "livré" ? (
                      <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 8, background: "#dcfce7", color: "#16a34a", fontWeight: 600 }}>Livré</span>
                    ) : (
                      <button onClick={() => deliverMut.mutate(i)} disabled={deliverMut.isPending} style={{
                        fontSize: 8, padding: "2px 7px", borderRadius: 6, border: "1.5px solid #16a34a",
                        cursor: "pointer", background: "#f0fdf4", color: "#16a34a", fontWeight: 600, whiteSpace: "nowrap",
                      }}>
                        ✓ Marquer reçu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Paiements ── */}
        {tab === "paiements" && (
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <SealCheck size={13} color={colors.accent} /> Suivi des paiements
            </div>
            {(!c.paiements || c.paiements.length === 0) ? (
              <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", padding: 16 }}>
                Le calendrier des paiements sera généré après la signature complète du contrat.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {c.paiements.map((p, i) => {
                  const paye = p.statut === "payé";
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6,
                      background: paye ? "#dcfce7" : colors.statBg,
                      borderLeft: `3px solid ${paye ? "#16a34a" : "#f59e0b"}`,
                      animation: "fadeSlideUp 0.25s ease",
                      animationDelay: `${i * 0.04}s`,
                      animationFillMode: "backwards",
                    }}>
                      <div style={{ minWidth: 76, fontSize: 9, color: colors.text, fontWeight: 500 }}>
                        {formatDate(p.echeance, { month: "short", year: "numeric" })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: colors.text }}>
                          {fmt(Number(p.montant))} FCFA
                        </div>
                        <div style={{ fontSize: 9, color: colors.textMuted }}>
                          {paye
                            ? `Payé le ${p.payeAt ? formatDate(p.payeAt) : "—"} ${p.methode ? `· ${p.methode}` : ""}`
                            : "En attente de paiement"}
                        </div>
                      </div>
                      {paye ? (
                        <CheckCircle size={14} color="#16a34a" weight="fill" />
                      ) : (
                        <button onClick={() => paiementMut.mutate(i)} disabled={paiementMut.isPending} style={{
                          padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                          background: "#059669", color: "#fff", fontSize: 9, fontWeight: 600,
                          opacity: paiementMut.isPending ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}>
                          Marquer réglé
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Summary */}
            {c.paiements && c.paiements.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 9, color: colors.textMuted, textAlign: "right" }}>
                {c.paiements.filter((p) => p.statut === "payé").length}/{c.paiements.length} payés
                · Total: {fmt(c.paiements.reduce((a, p) => a + Number(p.montant), 0))} FCFA
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Négociation ── */}
        {tab === "negociation" && (
          <div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Fil de négociation</div>
              {(!c.counterOffers || c.counterOffers.length === 0) ? (
                <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", padding: 12 }}>
                  Aucune contre-offre. Utilisez "Négocier" pour faire une proposition.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {c.counterOffers.map((off, i) => (
                    <div key={i} style={{
                      padding: "7px 9px", borderRadius: 6, fontSize: 10,
                      background: off.role === "buyer" ? `${colors.accent}0a` : colors.statBg,
                      border: `1px solid ${colors.borderLight}`,
                      marginLeft: off.role === "buyer" ? 0 : 14,
                      animation: "fadeSlideUp 0.2s ease",
                      animationDelay: `${i * 0.04}s`,
                      animationFillMode: "backwards",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: colors.text }}>{off.role === "buyer" ? "Vous" : "Producteur"}</span>
                        <span style={{ fontSize: 8, color: colors.textMuted }}>{formatDate(off.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ color: colors.textSecondary, display: "flex", gap: 6 }}>
                        <span>💰 {fmt(off.prixKg)} FCFA/kg</span>
                        <span>📦 {fmt(off.volumeKg)} kg</span>
                      </div>
                      {off.message && <div style={{ color: colors.textMuted, fontStyle: "italic", marginTop: 2, fontSize: 9 }}>"{off.message}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {canNeg && (
              <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Proposer une contre-offre</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>Prix (FCFA/kg)</label>
                    <input type="number" value={negP || ""} onChange={(e) => setNegP(Number(e.target.value))} style={{ width: "100%", padding: "6px 7px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2 }}>Volume (kg)</label>
                    <input type="number" value={negV || ""} onChange={(e) => setNegV(Number(e.target.value))} style={{ width: "100%", padding: "6px 7px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
                  </div>
                </div>
                <input value={negM} onChange={(e) => setNegM(e.target.value)} placeholder="Message (optionnel)" style={{ width: "100%", padding: "6px 7px", borderRadius: 6, border: `1.5px solid ${colors.borderLight}`, fontSize: 10, boxSizing: "border-box", marginBottom: 6, background: colors.inputBg, color: colors.text }} />
                <button onClick={() => negMut.mutate()} disabled={negMut.isPending} style={{
                  width: "100%", padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer",
                  background: colors.accent, color: "#fff", fontSize: 10, fontWeight: 600, opacity: negMut.isPending ? 0.6 : 1,
                }}>
                  {negMut.isPending ? "Envoi..." : "Envoyer la contre-offre"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Activité ── */}
        {tab === "activite" && (
          <div style={{ background: colors.surface, borderRadius: 12, padding: 12, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{t("contracts.detail.chronologie.title")}</div>
            {(() => {
              const evts: { icon: string; text: string; date: Date }[] = [
                { icon: "📄", text: t("contracts.detail.chronologie.cree"), date: new Date(c.createdAt) },
              ];
              if (c.statut !== "brouillon") evts.push({ icon: "📤", text: t("contracts.detail.chronologie.envoye"), date: new Date(c.updatedAt) });
              if (c.signatureBuyerAt) evts.push({ icon: "✍️", text: t("contracts.detail.chronologie.signeAcheteur"), date: new Date(c.signatureBuyerAt) });
              if (c.signatureProducteurAt) evts.push({ icon: "✍️", text: t("contracts.detail.chronologie.signeProducteur"), date: new Date(c.signatureProducteurAt) });
              if (["actif","termine","resilie"].includes(c.statut)) evts.push({ icon: c.statut === "resilie" ? "⛔" : c.statut === "termine" ? "✅" : "🚀", text: c.statut === "resilie" ? t("contracts.detail.chronologie.resilie") : c.statut === "termine" ? t("contracts.detail.chronologie.termine") : t("contracts.detail.chronologie.active"), date: new Date(c.updatedAt) });
              if (c.counterOffers) {
                for (const off of c.counterOffers) {
                  evts.push({ icon: "🤝", text: t("contracts.detail.chronologie.contreOffre", { role: t(off.role === "buyer" ? "common.you" : "common.farmer"), prix: fmt(off.prixKg) }), date: new Date(off.createdAt) });
                }
              }
              if (c.calendrierLivraisons) {
                for (const d of c.calendrierLivraisons) {
                  if (d.statut === "livré") evts.push({ icon: "📦", text: t("contracts.detail.chronologie.livraisonRecue", { volume: fmt(Number(d.volume)) }), date: new Date(d.date) });
                }
              }
              if (c.paiements) {
                for (const p of c.paiements) {
                  if (p.statut === "payé") evts.push({ icon: "💰", text: `Paiement de ${fmt(Number(p.montant))} FCFA réglé`, date: new Date(p.payeAt || p.echeance) });
                }
              }
              evts.sort((a, b) => b.date.getTime() - a.date.getTime());
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {evts.map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 7px", borderRadius: 6, background: colors.statBg, animation: "fadeSlideUp 0.2s ease", animationDelay: `${i * 0.03}s`, animationFillMode: "backwards" }}>
                      <span style={{ fontSize: 13 }}>{e.icon}</span>
                      <div style={{ flex: 1, fontSize: 10, color: colors.text }}>{e.text}</div>
                      <span style={{ fontSize: 8, color: colors.textMuted }}>{formatDate(e.date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Signature modal */}
        {showSign && (
          <div onClick={() => setShowSign(false)} style={{
            position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 16,
            backdropFilter: "blur(8px)",
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: colors.surface, borderRadius: isMobile ? 0 : 16, padding: isMobile ? 20 : 24, maxWidth: 380, width: "100%",
              height: isMobile ? "100%" : "auto", overflowY: "auto",
              boxShadow: isMobile ? "none" : colors.shadowXl,
              animation: "fadeSlideUp 0.25s ease",
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <SealCheck size={30} color={colors.accent} weight="fill" />
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginTop: 4 }}>Signature électronique</div>
                <div style={{ fontSize: 10, color: colors.textMuted }}>{tCrop(c.culture)} — {c.id.slice(0, 12)}…</div>
              </div>
              <div style={{ background: colors.statBg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 3 }}>Récapitulatif des termes :</div>
                <ul style={{ fontSize: 9, color: colors.textMuted, margin: 0, paddingLeft: 14, lineHeight: 1.6 }}>
                  <li>Volume : {fmt(Number(c.volumeKg))} kg</li>
                  <li>Prix : {fmt(Number(c.prixKg))} FCFA/kg</li>
                  <li>Montant : {fmt(Number(c.montantTotal))} FCFA</li>
                  <li>Durée : {formatDate(c.dateDebut)} → {formatDate(c.dateFin)}</li>
                </ul>
              </div>
              <button onClick={() => signMut.mutate()} disabled={signMut.isPending} style={{
                width: "100%", padding: "12px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "#fff",
                fontSize: isMobile ? 14 : 12, fontWeight: 600, opacity: signMut.isPending ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <SealCheck size={14} /> {signMut.isPending ? "Signature..." : "✓ Confirmer la signature"}
              </button>
              <button onClick={() => setShowSign(false)} style={{
                width: "100%", padding: "10px 0", border: "none", background: "none",
                color: colors.textMuted, fontSize: 11, cursor: "pointer", marginTop: 3,
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Cancel confirmation modal */}
        {showCancel && (
          <div onClick={() => setShowCancel(false)} style={{
            position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 16,
            backdropFilter: "blur(8px)",
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: colors.surface, borderRadius: isMobile ? 0 : 16, padding: isMobile ? 24 : 24, maxWidth: 360, width: "100%",
              height: isMobile ? "100%" : "auto",
              boxShadow: isMobile ? "none" : colors.shadowXl,
              animation: "fadeSlideUp 0.25s ease",
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <Warning size={30} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginTop: 4 }}>Résilier le contrat</div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{tCrop(c.culture)} — {c.id.slice(0, 12)}…</div>
              </div>
              <div style={{ background: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#991b1b", lineHeight: 1.5 }}>
                  Cette action est irréversible. Le contrat sera marqué comme <strong>Résilié</strong> et aucune livraison supplémentaire ne pourra être effectuée.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                <button onClick={() => setShowCancel(false)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                  cursor: "pointer", background: colors.surface, color: colors.text, fontSize: 11, fontWeight: 500,
                }}>
                  Annuler
                </button>
                <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 600,
                  opacity: cancelMut.isPending ? 0.6 : 1,
                }}>
                  {cancelMut.isPending ? "Résiliation..." : "Confirmer la résiliation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDelete && (
          <div onClick={() => setShowDelete(false)} style={{
            position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 16,
            backdropFilter: "blur(8px)",
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: colors.surface, borderRadius: isMobile ? 0 : 16, padding: isMobile ? 24 : 24, maxWidth: 360, width: "100%",
              height: isMobile ? "100%" : "auto",
              boxShadow: isMobile ? "none" : colors.shadowXl,
              animation: "fadeSlideUp 0.25s ease",
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <XCircle size={30} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginTop: 4 }}>Supprimer le contrat</div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{tCrop(c.culture)} — {c.id.slice(0, 12)}…</div>
              </div>
              <div style={{ background: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#991b1b", lineHeight: 1.5 }}>
                  Cette action est irréversible. Le contrat sera définitivement supprimé de la base de données.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                <button onClick={() => setShowDelete(false)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                  cursor: "pointer", background: colors.surface, color: colors.text, fontSize: 11, fontWeight: 500,
                }}>
                  Annuler
                </button>
                <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 600,
                  opacity: deleteMut.isPending ? 0.6 : 1,
                }}>
                  {deleteMut.isPending ? "Suppression..." : "Confirmer la suppression"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastStack toasts={toasts} />
      </div>
    </FadeIn>
  );
}

// ─── Main Export ──────────────────────────────────────────
export default function ContractsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  if (id === "new" || location.pathname === "/contracts/new") return <CreateWizard onBack={() => navigate("/contracts")} />;
  if (id) return <ContractDetail id={id} onBack={() => navigate("/contracts")} />;
  return <DashboardView onNew={() => navigate("/contracts/new")} />;
}
